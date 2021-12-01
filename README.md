# Harmonica's blockchain-based software pattern ontology

<div align="center">
    <br/>
    <p>
        This GitHub is the repository of a blockchain-based software pattern ontology, and a tool to navigate in it and get recommendations. This tool will be merged later with <a href="https://github.com/harmonica-project/BLADE">BLADE</a> later to create a tool for decision-making of blockchain technologies and patterns, stay tuned!
    </p>
    <p>
        Do you want to try it? <a href="http://onto-tool.blade-blockchain.eu/">Click here to access the tool</a>.
    </p>
  <br/>
</div> 

## Introduction

In this repository, you will find a blockchain-based software pattern ontology, that contains 160 software patterns on blockchain found in the academic literature. You will also find a tool that enables the exploration of the ontology through a graphical interface with filters. The tool also proposes a recommender to generate a set of adequate patterns to a user, as he answers a set of questions.
Finally, this repository contains a Python script capable of converting the Excel spreadsheet of collected software patterns to our ontology. 

To start, you can read our paper introducing in detail the ontology (coming soon), the method employed to create it, the tool, and a survey performed to validate the tool usability. You can also [check additional resources](#resources) below, that were not included in the paper. You will also found in [setup](#setup) some documentation to start the tool on your own machine and, if you want, regenerate the ontology using the Excel sheet.

## Resources

This repository hosts documents that were not included in our paper due to inherent size limit of the publication. Those documents have been placed in the [documents](https://github.com/harmonica-project/blockchain-patterns-ontology/tree/main/documents) directory. The list of documents is the following:

- [Pattern taxonomy](https://github.com/harmonica-project/blockchain-patterns-ontology/blob/main/documents/Pattern%20taxonomy.pdf): this document describes the pattern taxonomy, created during the completion of a previous systematic literature review (link below).
- [Problem ontology and questions](https://github.com/harmonica-project/blockchain-patterns-ontology/blob/main/documents/Problem%20ontology.pdf): for recommendation purposes, we created a problem ontology that is similar in its structure to the pattern taxonomy, and we designed some questions associated to those problems to enable recommendation making.
- [Ontology Requirements Specification Document (ORSD)](https://github.com/harmonica-project/blockchain-patterns-ontology/blob/main/documents/ORSD.pdf): contains the context, requirements, and competency questions of the ontology.
- [Experimental protocol](https://github.com/harmonica-project/blockchain-patterns-ontology/blob/main/documents/Experimental%20protocol.pdf): describes the experimental protocol employed to survey participants to evaluate the tool ontology produced in this work.

Another resource can be mentioned, that is the blockchain pattern collection. A systematic literature review were performed before creating the ontology to collect many blockchain-based software from the academic literature. Full results are available following [this link](https://github.com/harmonica-project/blockchain-patterns-collection).

## Setup

### Tool setup

To set up the tool, make sure you have the following package installed:

- Node.js (current version: v10.19)
- npm (current version: v6.14.4)
- [Apache Jena Fuseki](https://jena.apache.org/documentation/fuseki2/) (current version: v4.2, please follow the description on the website to install the tool AND enable Fuseki to be launched as a command by moving it to your $PATH)

To start, you'll have to setup your Apache Jena Fuseki to serve the ontology as a database. Go into the [ontologies](https://github.com/harmonica-project/blockchain-patterns-ontology/tree/main/ontologies) folder, and execute the following command:

```
fuseki-server --file ./result.ttl /result
```

Your server will probably serve at this address: http://localhost:3030/result/query. Make sure this is the case by following the link, then go into the tool source code in [fuseki.js](https://github.com/harmonica-project/blockchain-patterns-ontology/blob/main/tool/src/libs/fuseki.js), and change the FUSEKI_URL variable content by the Fuseki server URL.

Finally inside the [tool](https://github.com/harmonica-project/blockchain-patterns-ontology/tree/main/tool) repository, and execute the following commands:

```
npm install
npm start
```

If everything went fine, you should be able to open the tool on [localhost:3000](localhost:3000) and start using it. You can make sure that you are connected to Fuseki by checking the server status on home page: it should display connected. If you have an issue, please let us know by opening an issue on GitHub.