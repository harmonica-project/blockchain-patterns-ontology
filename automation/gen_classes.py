import json
import re
from string import Template

def parseToURI(name):
  nameArray = re.split('[, \-!?:()&*]+', name)
  nameArray = [word.capitalize() for word in nameArray]
  name = ''.join(nameArray)
  return name

def loadSLRData():
  with open('patterns_names_and_authors.json', 'r') as file:
    data = json.load(file)
    return data['Patterns'], data['Papers']

def loadClassTemplate():
  with open('class_template.txt', 'r') as file:
    return file.read()

def run():
  patterns, papers = loadSLRData()
  classes = ''
  template = loadClassTemplate()
  for p in patterns:
    type = parseToURI(p['Type'])
    if type == "ArchitecturalPattern" or type == "Idiom":
      classes += Template(template).substitute(owner="nicolas", uri=parseToURI(p['Name']), name=p['Name'], category=type)
    else:
      if "Subsubcategory" in p:
        classes += Template(template).substitute(owner="nicolas", uri=parseToURI(p['Name']), name=p['Name'], category=parseToURI(p['Subsubcategory']))
      else:
        classes += Template(template).substitute(owner="nicolas", uri=parseToURI(p['Name']), name=p['Name'], category=parseToURI(p['Subcategory']))
  
  with open("classes.txt", "w") as text_file:
    text_file.write(classes)

run()
