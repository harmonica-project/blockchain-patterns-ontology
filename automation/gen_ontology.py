import json
import re
from string import Template

# used by capitalizeURI as an exclusion list, words inside will not have its letters after the first one lowercased
capital_word_list = [
  "BPM"
]

UPDATE_CITATIONS = False

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

def get_pattern_proposal_from_id(pattern_proposals, paper_id):
  for p in pattern_proposals:
    if p['ID'] == paper_id:
      return p
  return False

def get_pattern_proposals_from_URI(pattern_proposals, paper_uri):
  compatible_patterns = []
  for p in pattern_proposals:
    if parse_to_URI(p['Name']) == paper_uri:
      compatible_patterns.append(p)
  return compatible_patterns

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

# generate the links between proposals. 5 different links exists, they are listed in the array below for easy detection in the dict
def get_links_between_patterns(pattern_proposals, pattern_proposal, example_mapping, papers):
  link_types = ["Created from", "Related to", "Variant of", "Requires", "Benefits from"]
  relation_template = load_template('relation')
  relations_str = ''

  for key in link_types:
    if key in pattern_proposal:
      relations = re.split(', ', pattern_proposal[key])
      relation_type = parse_to_relation(key)
      for r in relations:
        if r.isdigit():
          relation_paper = get_pattern_proposal_from_id(pattern_proposals, r)
          paper = get_paper_from_id(papers, relation_paper['Paper'])
          relation_paper_name = parse_to_URI(relation_paper['Name']) + paper['ID']
        else:
          if parse_to_URI(r) in example_mapping:
            relation_paper_name = example_mapping[parse_to_URI(r)]
          else:
            relation_paper_name = "Unknown"
        relations_str += Template(relation_template).substitute(relation=relation_type, value=relation_paper_name)
  return relations_str

# load the SLR data as a dict, returns three different dicts: papers, proposals, and classes
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
  proposal_template = load_template('example')
  if 'Application examples' in p:
    for example in p['Application examples'].split("• "):
      if len(example):
        examples += Template(proposal_template).substitute(example=example)
    return examples
  else:
    return ''

# create the mappings between proposal alternative names and classes
def create_proposal_to_class_mapping(pattern_classes):
  proposal_mapping = {}

  for c in pattern_classes:
    if 'Alternative names' in c:
      for an in c['Alternative names'].split(', '):
        proposal_mapping[parse_to_URI(an)] = parse_to_URI(c['Name'])
    proposal_mapping[parse_to_URI(c['Name'])] = parse_to_URI(c['Name'])

  return proposal_mapping

# used to parse context/solution fields of pattern objects into litterals that can be attached to individuals
def parse_to_ontology_literal_if_exists(item, key):
  if key in item:
    return item[key].replace('"', '')
  else:
    return ""

def get_paper_properties(paper):
  property_template = load_template('property')
  properties = (
    Template(property_template).substitute(property="Authors", value='"{}"^^rdfs:Literal'.format(paper['author'])) +
    Template(property_template).substitute(property="Year", value='"{}"^^rdfs:Literal'.format(paper['year'])) +
    Template(property_template).substitute(property="Title", value='"{}"^^rdfs:Literal'.format(paper['Title']))
  )

  # improve by iterating on paper properties instead of that, but the paper spread sheet must be cleaned a bit
  # another improval: use an ontology for papers like a bibtex based ontology (don't know if it exists)
  if "Identifier" in paper:
    properties += Template(property_template).substitute(property="Identifier", value='"{}"^^rdfs:Literal'.format(paper['Identifier']))
  if "Identifier type" in paper:
    properties += Template(property_template).substitute(property="IdentifierType", value='"{}"^^rdfs:Literal'.format(paper['Identifier type']))
  if "journal" in paper:
    properties += Template(property_template).substitute(property="Journal", value='"{}"^^rdfs:Literal'.format(paper['journal']))
  if "pages" in paper:
    properties += Template(property_template).substitute(property="Pages", value='"{}"^^rdfs:Literal'.format(paper['pages']))
  if "volume" in paper:
    properties += Template(property_template).substitute(property="Volume", value='"{}"^^rdfs:Literal'.format(paper['volume']))
  if "type" in paper:
    properties += Template(property_template).substitute(property="DocumentType", value='"{}"^^rdfs:Literal'.format(paper['type']))

  return properties

def generate_papers(papers_list):
  paper_template = load_template('paper')
  papers = ""
  for paper in papers_list:
    if (paper['Rejected after reading'] == "No"):
      papers += Template(paper_template).substitute(
        paperId=paper['ID'],
        title=paper['Title'],
        properties=get_paper_properties(paper), 
        owner="nicolas"
      )
  return papers

# generate_proposals() returns the proposals found in papers
def generate_proposals(pattern_proposals, proposal_mapping, papers):
  proposals = ""
  proposal_template = load_template('proposal')
  
  # iterate on pattern proposals to generate "proposal patterns" individuals
  for p in pattern_proposals:
    # get associated paper from pattern paper id
    paper = get_pattern_proposal_from_id(papers, p['Paper'])

    # generate pattern individuals, connected to their classes
    proposals += Template(proposal_template).substitute(
      owner="nicolas", 
      uri=parse_to_URI(p['Name']), 
      name=p['Name'], 
      blockchain=parse_to_URI(p['Target']), 
      domain=parse_to_URI(p['Applicability domain']), 
      refClass=proposal_mapping[parse_to_URI(p['Name'])], 
      context=parse_to_ontology_literal_if_exists(p, 'Context & Problem'), 
      solution=parse_to_ontology_literal_if_exists(p, 'Solution'),
      paperId=paper['ID'],
      links=get_links_between_patterns(pattern_proposals, p, proposal_mapping, papers),
      examples=get_application_examples(p),
      language=parse_to_URI(p['Language'])
    )

  return proposals

# generate_classes() returns all pattern classes
def generate_classes(pattern_classes):
  classes = ''
  class_template = load_template('class')

  for p in pattern_classes:
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

  return classes

# run() entry point of the script
# get templates and SLR data, iterate on canonicals then on examples to generate the classes + canonicals and examples
def run():
  papers, pattern_proposals, pattern_classes = load_SLR_data()

  with open('../ontologies/structure.ttl', 'r') as file:
    ontology_structure = file.read()

  # a double mapping is returned by this function: one maps a canonical name into an array of possible alternative names
  # and the other one maps an example name to its canonical
  proposal_mapping = create_proposal_to_class_mapping(pattern_classes)

  classes_ttl = generate_classes(pattern_classes)
  proposals_ttl = generate_proposals(pattern_proposals, proposal_mapping, papers)
  papers_ttl = generate_papers(papers)

  if (UPDATE_CITATIONS):
    print("Not managed by this script yet.")
    citations_ttl = ""
  else:
    with open("./results/citation_triples.ttl", "r") as text_file_citations:
      citations_ttl = text_file_citations.read()

  # write classes, papers and proposals in three distinct files, can be merged into a complete ontology
  with open("./results/classes.ttl", "w") as text_file_classes:
    text_file_classes.write(classes_ttl)

  with open("./results/proposals.ttl", "w") as text_file_proposals:
    text_file_proposals.write(proposals_ttl)

  with open("./results/papers.ttl", "w") as text_file_papers:
    text_file_papers.write(papers_ttl)

  with open("../ontologies/result.ttl", "w") as text_file_ontology:
    text_file_ontology.write(ontology_structure + classes_ttl + proposals_ttl + papers_ttl + citations_ttl)

run()
