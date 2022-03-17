import json
import requests
import networkx as nx
import matplotlib.pyplot as plt

G = nx.DiGraph()


with open("patterns_data.json") as f:
    papers = json.loads(f.read())
papers = {int(paper["ID"]): {"title": paper["Title"], "doi": paper["Identifier"]}
          for paper in papers["Papers"] if "Identifier" in paper}
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

with open("citation_triples.csv","w+") as f:
    for line in list(itertools.chain(*[[" cites ".join([G.nodes[citer]["doi"],G.nodes[citee]["doi"]]) for citee in G[citer]] for citer in G.nodes])):
        f.write(line+"\n")

print("results written in citation_triples.csv")

