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

def get_paper_from_id(papers, paper_id):
  for p in papers:
    if p['ID'] == paper_id:
      return p
  return False

def get_sample_pattern_from_id(sample_patterns, paper_id):
  for p in sample_patterns:
    if p['ID'] == paper_id:
      return p
  return False

def get_sample_pattern_from_URI(sample_patterns, paper_uri):
  for p in sample_patterns:
    if parse_to_URI(p['Name']) == paper_uri:
      return p
  return False

# receives an Author field, return the first author name
def get_first_author(authors):
  return re.split(', ', authors)[0]

# parse to ontology URI (first letter in caps, no special character)
def parse_to_URI(name):
  nameArray = re.split('[, \-!?:()/&*]+', name)
  nameArray = [capitalizeURI(word) for word in nameArray]
  name = ''.join(nameArray)
  return name

# parse to ontology relation (first letter in lowercase, no special character)
def parse_to_relation(name):
  nameArray = re.split('[, \-!?:()/&*]+', name)
  nameArray = [nameArray[0].lower()] + [capitalizeURI(nameArray[i]) for i in range(1, len(nameArray)) if i != 0]
  name = ''.join(nameArray)
  return name

# generate the links between example patterns. 5 different links exists, they are listed in the array below for easy detection in the dict
def get_links_between_patterns(sample_patterns, sample_pattern, example_mapping, papers):
  link_types = ["From pattern", "Related to", "Variant of", "Requires", "Benefits from"]
  relation_template = load_template('relation')
  relations_str = ''

  for key in link_types:
    if key in sample_pattern:
      relations = re.split(', ', sample_pattern[key])
      relation_type = parse_to_relation(key)
      for r in relations:
        if r.isdigit():
          relation_paper = get_sample_pattern_from_id(sample_patterns, r)
          paper = get_paper_from_id(papers, relation_paper['Paper'])
          relation_paper_name = parse_to_URI(relation_paper['Name']) + get_first_author(paper['author']) + paper['year']
        else:
          if parse_to_URI(r) in example_mapping:
            relation_paper_name = example_mapping[parse_to_URI(r)] + "Canonical"
          else:
            relation_paper_name = "Unknown"
        relations_str += Template(relation_template).substitute(relation=relation_type, value=relation_paper_name)

  return relations_str

# load the SLR data as a dict, returns three different dicts: papers, examples, and canonicals
def load_SLR_data():
  with open('patterns_data.json', 'r') as file:
    data = json.load(file)
    return data['Papers'], data['Paper patterns'], data['Canonical patterns']

# load an ontology template
def load_template(item):
  with open('./templates/' + item + '.txt', 'r') as file:
    return file.read()

def get_application_examples(p):
  examples = ""
  sample_template = load_template('example')
  if 'Application examples' in p:
    for example in p['Application examples'].split("• "):
      if len(example):
        examples += Template(sample_template).substitute(example=example)
    return examples
  else:
    return ''

# create the mappings between canonical names and example patterns names and vice versa
def create_exemple_to_canonical_mappings(canonical_patterns):
  canonical_mapping = {}
  example_mapping = {}

  for c in canonical_patterns:
    if 'Alternative names' in c:
      canonical_mapping[parse_to_URI(c['Name'])] = [parse_to_URI(c['Name'])] + [parse_to_URI(an) for an in c['Alternative names'].split(', ')]
      for an in c['Alternative names'].split(', '):
        example_mapping[parse_to_URI(an)] = parse_to_URI(c['Name'])
    else:
      canonical_mapping[parse_to_URI(c['Name'])] = [parse_to_URI(c['Name'])]
    example_mapping[parse_to_URI(c['Name'])] = parse_to_URI(c['Name'])

  return canonical_mapping, example_mapping

# used to parse context/solution fields of pattern objects into litterals that can be attached to individuals
def parse_to_ontology_literal_if_exists(item, key):
  if key in item:
    return item[key].replace('"', '')
  else:
    return ""

# generate_samples() returns the samples found in papers
def generate_samples(sample_patterns, example_mapping, papers):
  samples = ""
  sample_template = load_template('sample')
  
  # iterate on sample_patterns/examples to generate "sample patterns" individuals
  for p in sample_patterns:
    # get associated paper from pattern paper id
    paper = get_sample_pattern_from_id(papers, p['Paper'])

    # generate pattern individuals, connected to their canonicals and their classes
    samples += Template(sample_template).substitute(
      owner="nicolas", 
      uri=parse_to_URI(p['Name']), 
      name=p['Name'], 
      blockchain=parse_to_URI(p['Target']), 
      domain=parse_to_URI(p['Applicability domain']), 
      refClass=example_mapping[parse_to_URI(p['Name'])], 
      context=parse_to_ontology_literal_if_exists(p, 'Context & Problem'), 
      solution=parse_to_ontology_literal_if_exists(p, 'Solution'),
      author=get_first_author(paper['author']),
      year=paper['year'],
      links=get_links_between_patterns(sample_patterns, p, example_mapping, papers),
      examples=get_application_examples(p),
      language=parse_to_URI(p['Language'])
    )

  return samples

# generate_classes_and_canonicals() returns two strings: one for all classes associated to the patterns, another for all canonical patterns attached to those classes
def generate_classes_and_canonicals(canonical_patterns, sample_patterns, canonical_mapping, papers):
  classes = ''
  canonicals = ''
  class_template = load_template('class')
  canonical_template = load_template('canonical')
  relation_template = load_template('relation')

  for p in canonical_patterns:
    canonical_samples = ''
    patternType = parse_to_URI(p['Type (determined)'])
    # links individual to its class
    if patternType == "ArchitecturalPattern" or patternType == "Idiom":
      patternCategory = patternType
    else:
      if "Subsubcategory" in p:
        patternCategory = parse_to_URI(p['Subsubcategory'])
      else:
        patternCategory = parse_to_URI(p['Subcategory'])

    # create all classes using unique pattern names (will be canonical individuals later)
    classes += Template(class_template).substitute(
      owner="nicolas", 
      uri=parse_to_URI(p['Name']), 
      name=p['Name'], 
      category=patternCategory
    )

    # generates the relations (in Turtle) between a canonical individual and its samples
    if parse_to_URI(p['Name']) in canonical_mapping:
      for ex in canonical_mapping[parse_to_URI(p['Name'])]:
        sample_pattern = get_sample_pattern_from_URI(sample_patterns, ex)
        paper = get_paper_from_id(papers, sample_pattern['Paper'])
        canonical_samples += Template(relation_template).substitute(relation="hasSample", value=(ex + get_first_author(paper['author']) + paper['year']))

    # generate canonical individuals, linked to their related classes
    canonicals += Template(canonical_template).substitute(
      owner="nicolas", 
      uri=parse_to_URI(p['Name']), 
      name=p['Name'], 
      blockchain=parse_to_URI(p['Target (generalized)']), 
      domain=parse_to_URI(p['Applicability domain (generalized)']), 
      refClass=parse_to_URI(p['Name']), 
      samples=canonical_samples, 
      context='', 
      solution='',
      language=parse_to_URI(p['Language (generalized)'])
    )

  return classes, canonicals

# run() entry point of the script
# get templates and SLR data, iterate on canonicals then on examples to generate the classes + canonicals and examples
def run():
  papers, sample_patterns, canonical_patterns = load_SLR_data()

  with open('../ontologies/structure.ttl', 'r') as file:
    ontology_structure = file.read()

  # a double mapping is returned by this function: one maps a canonical name into an array of possible alternative names
  # and the other one maps an example name to its canonical
  canonical_mapping, example_mapping = create_exemple_to_canonical_mappings(canonical_patterns)

  classes, canonicals = generate_classes_and_canonicals(canonical_patterns, sample_patterns, canonical_mapping, papers)
  samples = generate_samples(sample_patterns, example_mapping, papers)
  
  # write classes, canonicals and samples in three distinct files, can be merged into a complete ontology
  with open("./results/classes.ttl", "w") as text_file_classes:
    text_file_classes.write(classes)

  with open("./results/canonicals.ttl", "w") as text_file_canonicals:
    text_file_canonicals.write(canonicals)

  with open("./results/samples.ttl", "w") as text_file_samples:
    text_file_samples.write(samples)

  with open("../ontologies/result.ttl", "w") as text_file_ontology:
    text_file_ontology.write(ontology_structure + classes + canonicals + samples)

run()
