import json
import re
from string import Template

# used by capitalizeURI as an exclusion list, words inside will not have its letters after the first one lowercased
capital_word_list = [
  "BPM"
]

def capitalizeURI(word):
  if word not in capital_word_list:
     return word.capitalize()
  else:
    return word

def getPaperFromId(papers, paper_id):
  for p in papers:
    if p['ID'] == paper_id:
      return p
  return False

def getPaperPatternFromId(paper_patterns, paper_id):
  for p in paper_patterns:
    if p['ID'] == paper_id:
      return p
  return False

def getPaperPatternFromURI(paper_patterns, paper_uri):
  for p in paper_patterns:
    if parseToURI(p['Name']) == paper_uri:
      return p
  return False

# receives an Author field, return the first author name
def getFirstAuthor(authors):
  return re.split(', ', authors)[0]

# parse to ontology URI (first letter in caps, no special character)
def parseToURI(name):
  nameArray = re.split('[, \-!?:()/&*]+', name)
  nameArray = [capitalizeURI(word) for word in nameArray]
  name = ''.join(nameArray)
  return name

# parse to ontology relation (first letter in lowercase, no special character)
def parseToRelation(name):
  nameArray = re.split('[, \-!?:()/&*]+', name)
  nameArray = [nameArray[0].lower()] + [capitalizeURI(nameArray[i]) for i in range(1, len(nameArray)) if i != 0]
  name = ''.join(nameArray)
  return name

# generate the links between example patterns. 5 different links exists, they are listed in the array below for easy detection in the dict
def get_links_between_patterns(paper_patterns, paper_pattern, paper, example_mapping):
  link_types = ["From pattern", "Related to", "Variant Of", "Requires", "Benefits from"]
  relation_template = loadTemplate('relation')
  relations_str = ''

  for key in link_types:
    if key in paper_pattern:
      relations = re.split(', ', paper_pattern[key])
      relation_type = parseToRelation(key)
      for r in relations:
        if r.isdigit():
          relation_paper = getPaperPatternFromId(paper_patterns, r)
          relation_paper_name = parseToURI(relation_paper['Name']) + getFirstAuthor(paper['author']) + paper['year']
        else:
          if parseToURI(r) in example_mapping:
            relation_paper_name = example_mapping[parseToURI(r)] + "Canonical"
          else:
            relation_paper_name = "Unknown"
        relations_str += Template(relation_template).substitute(relation=relation_type, value=relation_paper_name)

  return relations_str

# load the SLR data as a dict, returns three different dicts: papers, examples, and canonicals
def loadSLRData():
  with open('patterns_data.json', 'r') as file:
    data = json.load(file)
    return data['Papers'], data['Paper patterns'], data['Canonical patterns']

# load an ontology template
def loadTemplate(item):
  with open('./templates/' + item + '.txt', 'r') as file:
    return file.read()

# create the mappings between canonical names and example patterns names and vice versa
def createExempleToCanonicalMappings(canonical_patterns):
  canonical_mapping = {}
  example_mapping = {}

  for c in canonical_patterns:
    if 'Alternative names' in c:
      canonical_mapping[parseToURI(c['Name'])] = [parseToURI(c['Name'])] + [parseToURI(an) for an in c['Alternative names'].split(', ')]
      for an in c['Alternative names'].split(', '):
        example_mapping[parseToURI(an)] = parseToURI(c['Name'])
    else:
      canonical_mapping[parseToURI(c['Name'])] = [parseToURI(c['Name'])]
    example_mapping[parseToURI(c['Name'])] = parseToURI(c['Name'])

  return canonical_mapping, example_mapping

# used to parse context/solution fields of pattern objects into litterals that can be attached to individuals
def parseToOntologyLiteralIfExists(item, key):
  if key in item:
    return item[key].replace('"', '')
  else:
    return ""

# run() entry point of the script
# get templates and SLR data, iterate on canonicals then on examples to generate the classes + canonicals and examples
def run():
  papers, paper_patterns, canonical_patterns = loadSLRData()
  classes = ''
  canonicals = ''
  examples = ''

  with open('../ontologies/structure.ttl', 'r') as file:
    ontology_structure = file.read()

  # this script use Template to generate Turtle files for the ontology
  class_template = loadTemplate('class')
  canonical_template = loadTemplate('canonical')
  example_template = loadTemplate('paper')
  relation_template = loadTemplate('relation')
  # a double mapping is returned by this function: one maps a canonical name into an array of possible alternative names
  # and the other one maps an example name to its canonical
  canonical_mapping, example_mapping = createExempleToCanonicalMappings(canonical_patterns)

  for p in canonical_patterns:
    canonical_examples = ''
    patternType = parseToURI(p['Type (determined)'])
    # links individual to its class
    if patternType == "ArchitecturalPattern" or patternType == "Idiom":
      patternCategory = patternType
    else:
      if "Subsubcategory" in p:
        patternCategory = parseToURI(p['Subsubcategory'])
      else:
        patternCategory = parseToURI(p['Subcategory'])

    # create all classes using unique pattern names (will be canonical individuals later)
    classes += Template(class_template).substitute(
      owner="nicolas", 
      uri=parseToURI(p['Name']), 
      name=p['Name'], 
      category=patternCategory
    )

    # generates the relations (in Turtle) between a canonical individual and its examples
    if parseToURI(p['Name']) in canonical_mapping:
      for ex in canonical_mapping[parseToURI(p['Name'])]:
        paper_pattern = getPaperPatternFromURI(paper_patterns, ex)
        paper = getPaperFromId(papers, paper_pattern['Paper'])
        canonical_examples += Template(relation_template).substitute(relation="hasExample", value=(ex + getFirstAuthor(paper['author']) + paper['year']))

    # generate canonical individuals, linked to their related classes
    canonicals += Template(canonical_template).substitute(
      owner="nicolas", 
      uri=parseToURI(p['Name']), 
      name=p['Name'], 
      technology=parseToURI(p['Target (generalized)']), 
      domain=parseToURI(p['Applicability domain (generalized)']), 
      refClass=parseToURI(p['Name']), 
      examples=canonical_examples, 
      context='', 
      solution=''
    )

  # iterate on paper_patterns/examples to generate "paper" individuals
  for p in paper_patterns:
    # get associated paper from pattern paper id
    paper = getPaperPatternFromId(papers, p['Paper'])
    patternType = parseToURI(p['Type (determined)'])

    # links individual to its class
    if patternType == "ArchitecturalPattern" or patternType == "Idiom":
      patternCategory = patternType
    else:
      if "Subsubcategory" in p:
        patternCategory = parseToURI(p['Subsubcategory'])
      else:
        patternCategory = parseToURI(p['Subcategory'])

    # generate pattern individuals, connected to their canonicals and their classes
    examples += Template(example_template).substitute(
      owner="nicolas", 
      uri=parseToURI(p['Name']), 
      name=p['Name'], 
      technology=parseToURI(p['Target']), 
      domain=parseToURI(p['Applicability domain']), 
      refClass=example_mapping[parseToURI(p['Name'])], 
      context=parseToOntologyLiteralIfExists(p, 'Context & Problem'), 
      solution=parseToOntologyLiteralIfExists(p, 'Solution'),
      author=getFirstAuthor(paper['author']),
      year=paper['year'],
      links=get_links_between_patterns(paper_patterns, p, paper, example_mapping)
    )
  
  # write classes, canonicals and examples in three distinct files, can be merged into a complete ontology
  with open("./results/classes.ttl", "w") as text_file_classes:
    text_file_classes.write(classes)

  with open("./results/canonicals.ttl", "w") as text_file_canonicals:
    text_file_canonicals.write(canonicals)

  with open("./results/examples.ttl", "w") as text_file_examples:
    text_file_examples.write(examples)

  with open("../ontologies/result.ttl", "w") as text_file_ontology:
    text_file_ontology.write(ontology_structure + classes + canonicals + examples)

run()
