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
        SELECT ?relation ?individual ?pattern ?iLabel ?paper ?context ?solution ?title ?identifier ?identifiertype ?authors
        WHERE {
            ${patternURI} ?relation ?individual.
            FILTER (?relation IN (
                onto:requires,
                onto:createdFrom,
                onto:relatedTo,
                onto:variantOf,
                onto:benefitsFrom
            ) ).
            ?individual a ?pattern.
            ?pattern rdfs:subClassOf* onto:Pattern.
            ?individual rdfs:label ?iLabel .
            ?individual onto:hasPaper ?paper .
            ?individual onto:ContextAndProblem ?context .
            ?individual onto:Solution ?solution.
            ?paper onto:Title ?title.
            ?paper onto:Identifier ?identifier.
            ?paper onto:IdentifierType ?identifiertype.
            ?paper onto:Authors ?authors
        }
    `;

    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) {
            return parseResults(await response.json()).map(r => ({ ...parseIndividual(r), relation: r.relation }));
        };
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
};

const parseIndividual = (result) => {
    return {
        individual: result.individual.value,
        pattern: result.pattern.value,
        context: result.context.value,
        solution: result.solution.value,
        label: result.iLabel.value,
        paper: {
            paper: result.paper.value,
            title: result.title.value,
            identifier: result.identifier.value,
            identifiertype: result.identifiertype.value,
            authors: result.authors.value
        }
    }
}

const checkAndInsertIndividual = (result, individuals) => {
    const index = individuals.findIndex(i => i.individual === result.individual.value);
    if (index !== -1) {
        individuals[index].classes.push(result.parent.value);
    } else {
        individuals.push({
            ...parseIndividual(result),
            classes: [result.parent.value]
        })
    }
    
    return individuals;
};

const groupPatterns = (results) => {
    const groupedPatterns = {};

    results.forEach(r => {
        if (groupedPatterns[r.pattern.value]) {
            groupedPatterns[r.pattern.value] = {
                ...groupedPatterns[r.pattern.value],
                individuals: checkAndInsertIndividual(r, groupedPatterns[r.pattern.value].individuals)
            }
        } else {
            groupedPatterns[r.pattern.value] = {
                pattern: r.pattern.value,
                label: r.pLabel.value,
                individuals: [{
                    ...parseIndividual(r),
                    classes: [r.parent.value]
                }]
            }
        }
    });

    return groupedPatterns;
};

export const getPatterns = async () => {
    const query = `
        SELECT ?parent ?pattern ?pLabel ?individual ?iLabel ?paper ?context ?solution ?title ?identifier ?identifiertype ?authors
            WHERE {
                ?individual a ?parent.
                ?pattern rdfs:subClassOf* onto:Pattern.
                ?individual a ?pattern.
                ?pattern rdfs:label ?pLabel.
                ?individual rdfs:label ?iLabel .
                ?individual onto:hasPaper ?paper .
                ?individual onto:ContextAndProblem ?context .
                ?individual onto:Solution ?solution.
                ?paper onto:Title ?title.
                ?paper onto:Identifier ?identifier.
                ?paper onto:IdentifierType ?identifiertype.
                ?paper onto:Authors ?authors
            }
        `

    try {
        let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
        if (response.status === 200) {
            const results = parseResults(await response.json());
            const grouped = groupPatterns(results);
            return grouped;
        };
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
}

const addScoreToPatterns = (patterns, filterProblems) => {
    const newPatterns = patterns.map(pattern => ({
        ...pattern,
        score: filterProblems[pattern.problem.value].score
    }));
    return newPatterns;
};

export const getPatternsByProblem = async (filterProblems = {}) => {
    const queryTemplate = () => {
        return `
            select distinct ?problem ?individual ?pattern ?pLabel ?iLabel ?paper ?context ?solution ?title ?identifier ?identifiertype ?authors where {
                    ?pattern rdfs:subClassOf* 
                        [ 
                        rdf:type owl:Restriction ;
                        owl:onProperty onto:addressProblem ;
                        owl:someValuesFrom ?problem
                        ].
                    FILTER (?problem IN (${Object.keys(filterProblems).join(',')}) ).
                    ?pattern rdfs:subClassOf* onto:Pattern.
                    ?individual a ?pattern.
                    ?pattern rdfs:label ?pLabel.
                    ?individual rdfs:label ?iLabel .
                    ?individual onto:hasPaper ?paper .
                    ?individual onto:ContextAndProblem ?context .
                    ?individual onto:Solution ?solution.
                    ?paper onto:Title ?title.
                    ?paper onto:Identifier ?identifier.
                    ?paper onto:IdentifierType ?identifiertype.
                    ?paper onto:Authors ?authors
            }
        `
    }

    if (Object.keys(filterProblems).length > 0) {
        try {
            let query = queryTemplate()
            let response = await fetch( FUSEKI_URL, getOptions(PREFIXES + query) );
            if (response.status === 200) {
                const results = parseResults(await response.json());
                const scored = addScoreToPatterns(results, filterProblems);
                const mapped = scored.map(r => ({ ...parseIndividual(r), score: r.score }));
                return mapped;
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