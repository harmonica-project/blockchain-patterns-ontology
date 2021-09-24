import json
import re
from string import Template

def parseNameToURI(name):
  nameArray = re.split('[, \-!?:()&]+', name)
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
  template = loadClassTemplate()
  print(template)
  for p in patterns:
    print(Template(template).substitute(owner="nicolas", uri=parseNameToURI(p['Name']), name=p['Name']))

run()
