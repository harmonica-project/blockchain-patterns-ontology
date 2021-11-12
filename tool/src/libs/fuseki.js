import { parseResults, convertResultToMapping } from './helpers';

const FUSEKI_URL = "https://bc-ontology-experiment-fuseki.francecentral.cloudapp.azure.com:8888/result/query"
const PREFIXES = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX onto: <http://www.semanticweb.org/nicolas/ontologies/2021/8/patterns#>
`

const getOptions = (query) => {
    return {
        method: 'POST',
        body: `query=${query}`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
};

export const healthCheck = async () => {
    // test dummy query to check if Fuseki is live
    const query = `
        SELECT ?s ?p ?v
        WHERE {
            ?s ?p ?v
        }
        LIMIT 1
    `

    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) return true;
        return false;
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return false;
    }
}

export const getSubclasses = async (className) => {
    const query = `
        SELECT ?subject ?label
        WHERE {
            ?subject rdfs:subClassOf ${className}.
            ?subject rdfs:label ?label.
        }
    `
    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) {
            return convertResultToMapping(parseResults(await response.json()));
        }
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
}

const createClassesTree = (classes) => {
    let orderedClasses = {};

    classes.forEach(classpair => {
        if (!orderedClasses[classpair.parent.value]) {
            orderedClasses[classpair.parent.value] = {
                childrens: [classpair.child.value],
                parent: "",
                label: classpair.label.value
            }
        } else {
            orderedClasses[classpair.parent.value].childrens.push(classpair.child.value);
        }

        if (!orderedClasses[classpair.child.value]) orderedClasses[classpair.child.value] = {
            childrens: [],
            parent: classpair.parent.value,
            label: classpair.label.value
        };

        if (classpair.description) {
            orderedClasses[classpair.child.value] = {...orderedClasses[classpair.child.value], description: classpair.description.value};
        }
    });

    return orderedClasses;
};

export const getClassTree = async (classname) => {
    // ${isProblem ? "?subject onto:problemDescription ?description" : ""}
    let query = `
        SELECT ?parent ?child ?description ?label

        WHERE {
            ?parent rdfs:subClassOf* ${classname}.
            ?child rdfs:subClassOf ?parent.
            ?child rdfs:label ?label.
            OPTIONAL {
                ?child onto:problemDescription ?description.
            }
        }
    `

    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) {
            return createClassesTree(parseResults(await response.json()));
        };
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
};

export const getPattern = async (patternURI) => {
    let query = `
        SELECT DISTINCT ?label ?paper ?context ?solution ?classname
        WHERE {
            ${patternURI} rdfs:label ?label .
            ${patternURI} onto:hasPaper ?paper .
            ${patternURI} onto:ContextAndProblem ?context .
            ${patternURI} onto:Solution ?solution .
            ${patternURI} a ?classname .
            ?classname rdfs:subClassOf* onto:Pattern
        }
    `;

    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) {
            return parseResults(await response.json());
        };
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
};

export const getLinkedPatterns = async (patternURI) => {
    let query = `
        SELECT ?relation ?individual ?patternclass ?label ?paper ?context ?solution ?title ?identifier ?identifiertype
        WHERE {
            ${patternURI} ?relation ?individual.
            FILTER (?relation IN (
                onto:requires,
                onto:createdFrom,
                onto:relatedTo,
                onto:variantOf,
                onto:benefitsFrom
            ) ).
            ?individual a ?patternclass.
            ?patternclass rdfs:subClassOf* onto:Pattern.
            ?individual rdfs:label ?label .
            ?individual onto:hasPaper ?paper .
            ?individual onto:ContextAndProblem ?context .
            ?individual onto:Solution ?solution.
            ?paper onto:Title ?title.
            ?paper onto:Identifier ?identifier.
            ?paper onto:IdentifierType ?identifiertype
        }
    `;

    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) {
            return parseResults(await response.json());
        };
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
};

export const getPatterns = async (filterClasses = {}) => {
    let query = "";
    let letters = [...Array(26)].map((x,i)=>String.fromCharCode(i + 97));

    const queryTemplate = (classes) => {
        return `SELECT DISTINCT ?patternclass ?individual ?label ?paper ?context ?solution ?identifier ?identifiertype ?title
                    WHERE {
                        ?patternclass rdfs:subClassOf* onto:Pattern.
                        ${classes.map((c, i) => `?${letters[i]} rdfs:subClassOf* ${c}.`).join('\n')}
                        ?individual a ${classes.map((c, i) => `?${letters[i]}`).join()}.
                        ?individual a ?patternclass.
                        ?individual rdfs:label ?label .
                        ?individual onto:hasPaper ?paper .
                        ?individual onto:ContextAndProblem ?context .
                        ?individual onto:Solution ?solution.
                        ?paper onto:Title ?title.
                        ?paper onto:Identifier ?identifier.
                        ?paper onto:IdentifierType ?identifiertype
                    }
                `
    }
    
    const filters = 
        [...Object.keys(filterClasses)]
            .map(key => filterClasses[key])
            .filter(val => val !== 'prompt');

    query = queryTemplate(filters.length ? filters : ["onto:Pattern"])

    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) {
            return parseResults(await response.json());
        };
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
}

export const getPatternsByProblem = async (filterProblems = {}) => {
    const queryTemplate = () => {
        return `
            select distinct ?individual ?patternclass ?label ?paper ?context ?solution ?title ?identifier ?identifiertype where {
                    ?patternclass rdfs:subClassOf* 
                        [ 
                        rdf:type owl:Restriction ;
                        owl:onProperty onto:addressProblem ;
                        owl:someValuesFrom ?p
                        ].
                    FILTER (?p IN (${Object.keys(filterProblems).join(',')}) ).
                    ?patternclass rdfs:subClassOf* onto:Pattern.
                    ?individual a ?patternclass.
                    ?individual rdfs:label ?label .
                    ?individual onto:hasPaper ?paper .
                    ?individual onto:ContextAndProblem ?context .
                    ?individual onto:Solution ?solution.
                    ?paper onto:Title ?title.
                    ?paper onto:Identifier ?identifier.
                    ?paper onto:IdentifierType ?identifiertype
            }
        `
    }
    
    if (Object.keys(filterProblems).length > 0) {
        try {
            let query = queryTemplate()
            let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
            if (response.status === 200) {
                return parseResults(await response.json());
            };
            return [];
        } catch (e) {
            console.error('Failed to fetch: ' + e);
            return [];
        }
    } else {
        return {};
    }
}