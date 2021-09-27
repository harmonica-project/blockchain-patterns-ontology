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

def parseToURI(name):
  nameArray = re.split('[, \-!?:()&*]+', name)
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

def run():
  papers, paper_patterns, canonical_patterns = loadSLRData()
  classes = ''
  canonicals = ''
  class_template = loadTemplate('class')
  canonical_template = loadTemplate('canonical')

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
  
  with open("./results/classes.ttl", "w") as text_file_classes:
    text_file_classes.write(classes)

  with open("./results/canonicals.ttl", "w") as text_file_canonicals:
    text_file_canonicals.write(canonicals)

run()
