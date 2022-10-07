import requests
import re
from string import Template
import json
import networkx as nx
from networkx.drawing.nx_agraph import write_dot
import itertools
G = nx.DiGraph()

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

def get_proposal_from_id(proposals, paper_id):
  for p in proposals:
    if p['ID'] == paper_id:
      return p
  return False

def get_proposals_from_URI(proposals, paper_uri):
  compatible_patterns = []
  for p in proposals:
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

def get_proposal_URI(proposal, papers):
  paper = get_paper_from_id(papers, proposal['Paper'])
  return parse_to_URI(proposal['Name']) + get_first_author(paper['author']) + paper['year'] + get_first_word_title(paper['Title'])

def get_proposal_name(proposal, papers):
  paper = get_paper_from_id(papers, proposal['Paper'])
  return "{} ({}, {})".format(proposal['Name'], get_first_author(paper['author']), paper['year'])


def get_paper_URI(paper):
  return get_first_author(paper['author']) + paper['year'] + get_first_word_title(paper['Title'])
  
# generate the links between proposals. 5 different links exists, they are listed in the array below for easy detection in the dict
def get_links_between_proposals(proposals, example_mapping, papers):
  relations = {}
  link_types = ["Created from", "Related to", "Variant of", "Requires", "Benefits from"]

  for proposal in proposals:
    proposal_uri = get_proposal_URI(proposal, papers)

    for key in link_types:
      if key in proposal:
        proposal_relations = re.split(', ', proposal[key])
        relation_type = parse_to_relation(key)
        
        for r in proposal_relations:
          if r.isdigit():
            target = get_proposal_from_id(proposals, r)
            target_uri = get_proposal_URI(target, papers)
          else:
            if parse_to_URI(r) in example_mapping:
              target_uri = example_mapping[parse_to_URI(r)]
            else:
              target_uri = "Unknown"

          if (proposal_uri not in relations):
            relations[proposal_uri] = []

          relations[proposal_uri].append({
            'target': target_uri,
            'relation': relation_type
          })
  return relations

# generate the links between proposals. 5 different links exists, they are listed in the array below for easy detection in the dict
def get_proposal_links_parsed(proposal_uri, proposals_links):
  if proposal_uri in proposals_links:
    relation_template = load_template('relation')
    relations_str = ''

    for link in proposals_links[proposal_uri]:
      relations_str += Template(relation_template).substitute(
        relation=link['relation'],
        value=link['target']
      )
    return relations_str
  else:
    return ''

# load the SLR data as a dict, returns three different dicts: papers, proposals, and classes
def load_SLR_data():
  r = requests.get('https://raw.githubusercontent.com/harmonica-project/blockchain-patterns-collection/main/collection.json')
  if (r.status_code == 200):
    content = r.json()
    return content['Papers'], content['Proposals'], content['Patterns']
  else:
    print('Cannot retrieve the JSON pattern file from GitHub.')
    quit()

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
        examples += Template(proposal_template).substitute(example=example.replace("\n", ""))
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
    return item[key].replace('"', '').replace("\n", "")
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

def generate_citations(papers):
  print('Generating citations, this may take a while ...')
  citations = ''

  papers = {int(paper["ID"]): {"title": paper["Title"], "doi": paper["Identifier"]}
          for paper in papers if "Identifier" in paper}
  max_id=max(papers.keys())
  for identifier, data in list(papers.items()):
      G.add_node(identifier,snowball=False,doi=data["doi"])
      resp = requests.get(
          f"https://scholar.miage.dev/snowball?title={data['title']}", headers={"Accept": "application/json"})
      if resp.status_code == 200:
          resp_json = resp.json()
          for ref in resp_json:
              if ref == "":
                  continue
              if ref not in set([paper["doi"] for _, paper in papers.items()]):
                  max_id+=1
                  new_identifier = max_id
                  papers.update({new_identifier: {"doi": ref}})
                  G.add_node(new_identifier, snowball=True,doi=ref)
                  G.add_edge(new_identifier, identifier)
                  print(
                      f"New paper {ref} cites {data['doi']}")
              else:
                
                  edge_identifier = [
                      iid for iid in papers.keys() if papers[iid]["doi"] == ref][0]
                  if identifier != edge_identifier:
                      G.add_edge(edge_identifier,identifier)
                      print(
                          f"New paper {ref} and cites {papers[edge_identifier]['doi']}")

  for line in list(itertools.chain(*[[f":Identifier{citer} :references :Identifier{citee}." for citee in G[citer]] for citer in G.nodes])):
    citations += line + "\n"
  for line in list(itertools.chain(*[[f":Identifier{doi} rdf:type :Identifier." for doi in G.nodes]])):
    citations += line + "\n"
  for line in list(itertools.chain(*[[f":Identifier{doi} rdfs:label \"{G.nodes[doi]['doi']}\"^^rdfs:Literal." for doi in G.nodes]])):
    citations += line + "\n"

  return citations

def generate_papers(papers_list):
  paper_template = load_template('paper')
  papers = ""
  for paper in papers_list:
    papers += Template(paper_template).substitute(
      author=get_first_author(paper['author']), 
      year=paper['year'], 
      title=paper['Title'],
      title_word=get_first_word_title(paper['Title']),
      properties=get_paper_properties(paper), 
      owner="nicolas",
      id=paper['ID']
    )
  return papers

# generate_proposals() returns the proposals found in papers
def generate_proposals(proposals, proposal_mapping, proposals_links, papers, variants_mapping):
  proposals_str = ""
  proposal_template = load_template('proposal')
  variants = {}

  # iterate on pattern proposals to generate "proposal patterns" individuals
  for p in proposals:
    # get associated paper from pattern paper id
    paper = get_proposal_from_id(papers, p['Paper'])
    proposal_uri = get_proposal_URI(p, papers)
    paper_uri = get_paper_URI(paper)

    if (proposal_uri in variants_mapping):
      refPattern = variants_mapping[proposal_uri]
      variant = parse_to_URI(p['Name'])
    else:
      refPattern = proposal_mapping[parse_to_URI(p['Name'])]
      variant = proposal_mapping[parse_to_URI(p['Name'])]

    # generate pattern individuals, connected to their classes
    proposals_str += Template(proposal_template).substitute(
      owner="nicolas", 
      proposal_uri=proposal_uri,
      paper_uri=paper_uri,
      name=get_proposal_name(p, papers),
      variant=variant, 
      blockchain=parse_to_URI(p['Target']), 
      domain=parse_to_URI(p['Applicability domain']), 
      context=parse_to_ontology_literal_if_exists(p, 'Context & Problem'), 
      solution=parse_to_ontology_literal_if_exists(p, 'Solution'),
      links=get_proposal_links_parsed(proposal_uri, proposals_links),
      examples=get_application_examples(p),
      language=parse_to_URI(p['Language'])
    )

  return proposals_str

# generate_patterns() returns all pattern classes
def generate_variants(pattern_classes, proposals, papers):
  variants_str = ''
  variants_mapping = {}
  variant_template = load_template('variant')

  for p in pattern_classes:
    if ('Variant' in p):
      for p_id in p['Variant'].split(', '):
        proposal = get_proposal_from_id(proposals, p_id)
        proposal_uri = get_proposal_URI(proposal, papers)
        variants_mapping[proposal_uri] = parse_to_URI(p['Name'])

        variants_str += Template(variant_template).substitute(
          owner="nicolas", 
          uri=parse_to_URI(proposal['Name']),
          refClass=parse_to_URI(p['Name']),
          name=proposal['Name']
        )
    
    variants_str += Template(variant_template).substitute(
      owner="nicolas", 
      uri=parse_to_URI(p['Name']),
      refClass=parse_to_URI(p['Name']),
      name=p['Name']
    )

  return variants_str, variants_mapping

# generate_patterns() returns all pattern classes
def generate_patterns(pattern_classes):
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
  papers, proposals, pattern_classes = load_SLR_data()

  with open('../ontologies/structure.ttl', 'r') as file:
    ontology_structure = file.read()

  # a double mapping is returned by this function: one maps a canonical name into an array of possible alternative names
  # and the other one maps an example name to its canonical
  proposal_mapping = create_proposal_to_class_mapping(pattern_classes)
  proposals_links = get_links_between_proposals(proposals, proposal_mapping, papers)
  
  patterns_ttl = generate_patterns(pattern_classes)
  variants_ttl, variants_mapping = generate_variants(pattern_classes, proposals, papers)
  proposals_ttl = generate_proposals(proposals, proposal_mapping, proposals_links, papers, variants_mapping)
  papers_ttl = generate_papers(papers)
  citations_ttl = generate_citations(papers)

  if (UPDATE_CITATIONS):
    print("Not managed by this script yet.")
    citations_ttl = ""
  else:
    with open("./results/citation_triples.ttl", "r") as text_file_citations:
      citations_ttl = text_file_citations.read()

  # write classes, papers and proposals in three distinct files, can be merged into a complete ontology
  with open("./results/classes.ttl", "w") as text_file_classes:
    text_file_classes.write(patterns_ttl)

  with open("./results/proposals.ttl", "w") as text_file_proposals:
    text_file_proposals.write(proposals_ttl)

  with open("./results/papers.ttl", "w") as text_file_papers:
    text_file_papers.write(papers_ttl)

  with open("./results/variants.ttl", "w") as text_file_variants:
    text_file_variants.write(variants_ttl)

  with open("./results/citations.ttl", "w") as text_file_citations:
    text_file_citations.write(citations_ttl)

  with open("../ontologies/ontology.ttl", "w") as text_file_ontology:
    text_file_ontology.write(ontology_structure + patterns_ttl + proposals_ttl + papers_ttl + variants_ttl + citations_ttl)

run()
