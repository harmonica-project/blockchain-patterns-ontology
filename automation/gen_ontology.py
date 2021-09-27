import json
import re
from string import Template

capital_word_list = [
  "BPM"
]

def capitalizeURI(word):
  if word not in capital_word_list:
     return word.capitalize()
  else:
    return word

def getPaperFromId(papers, paperId):
  for p in papers:
    if p['ID'] == paperId:
      return p

def getFirstAuthor(authors):
  return re.split(', ', authors)[0]

def parseToURI(name):
  nameArray = re.split('[, \-!?:()/&*]+', name)
  nameArray = [capitalizeURI(word) for word in nameArray]
  name = ''.join(nameArray)
  return name

def loadSLRData():
  with open('patterns_data.json', 'r') as file:
    data = json.load(file)
    return data['Papers'], data['Paper patterns'], data['Canonical patterns']

def loadTemplate(item):
  with open('./templates/' + item + '.txt', 'r') as file:
    return file.read()

def createExempleToCanonicalMappings(canonical_patterns):
  canonical_mapping = {}
  example_mapping = {}

  for c in canonical_patterns:
    if 'Alternative names' in c:
      canonical_mapping[parseToURI(c['Name'])] = [parseToURI(an) for an in c['Alternative names'].split(', ')]
      for an in c['Alternative names'].split(', '):
        example_mapping[parseToURI(an)] = parseToURI(c['Name'])
    example_mapping[parseToURI(c['Name'])] = parseToURI(c['Name'])

  return canonical_mapping, example_mapping

def parseToOntologyLiteralIfExists(item, key):
  if key in item:
    return item[key].replace('"', '')
  else:
    return ""

def run():
  papers, paper_patterns, canonical_patterns = loadSLRData()
  classes = ''
  canonicals = ''
  examples = ''
  class_template = loadTemplate('class')
  canonical_template = loadTemplate('canonical')
  example_template = loadTemplate('paper')
  canonical_mapping, example_mapping = createExempleToCanonicalMappings(canonical_patterns)

  for p in canonical_patterns:
    patternType = parseToURI(p['Type (determined)'])
    if patternType == "ArchitecturalPattern" or patternType == "Idiom":
      patternCategory = patternType
    else:
      if "Subsubcategory" in p:
        patternCategory = parseToURI(p['Subsubcategory'])
      else:
        patternCategory = parseToURI(p['Subcategory'])

    classes += Template(class_template).substitute(
      owner="nicolas", 
      uri=parseToURI(p['Name']), 
      name=p['Name'], 
      category=patternCategory
    )

    canonicals += Template(canonical_template).substitute(
      owner="nicolas", 
      uri=parseToURI(p['Name']), 
      name=p['Name'], 
      technology=parseToURI(p['Target (generalized)']), 
      domain=parseToURI(p['Applicability domain (generalized)']), 
      refClass=parseToURI(p['Name']), 
      examples='', 
      context='', 
      solution=''
    )

  for p in paper_patterns:
    paper = getPaperFromId(papers, p['Paper'])
    patternType = parseToURI(p['Type (determined)'])
    if patternType == "ArchitecturalPattern" or patternType == "Idiom":
      patternCategory = patternType
    else:
      if "Subsubcategory" in p:
        patternCategory = parseToURI(p['Subsubcategory'])
      else:
        patternCategory = parseToURI(p['Subcategory'])

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
      year=paper['year']
    )
  
  with open("./results/classes.ttl", "w") as text_file_classes:
    text_file_classes.write(classes)

  with open("./results/canonicals.ttl", "w") as text_file_canonicals:
    text_file_canonicals.write(canonicals)

  with open("./results/examples.ttl", "w") as text_file_examples:
    text_file_examples.write(examples)

run()
