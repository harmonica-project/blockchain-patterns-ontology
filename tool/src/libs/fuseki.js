import { parseResults, convertResultToMapping } from './helpers';

const FUSEKI_URL = "http://localhost:3030/ontotool/sparql"
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
        SELECT ?l ?p
        WHERE {
            onto:Pattern rdfs:label ?l
        }
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

export const getVariantRelations = async (variantURI) => {
    let query = `
        SELECT ?relation ?variant ?variant_label
        WHERE {
            ${variantURI} ?relation ?variant
            FILTER (?relation IN (
                onto:requires,
                onto:createdFrom,
                onto:relatedTo,
                onto:variantOf,
                onto:benefitsFrom
            ) ).
            ?variant rdfs:label ?variant_label
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

const parseProposal = (result) => {
    return {
        proposal: result.proposal.value,
        pattern: result.pattern.value,
        context: result.context.value,
        solution: result.solution.value,
        label: result.proposal_label.value,
        paper: {
            paper: result.paper.value,
            title: result.title.value,
            identifier: result.identifier.value,
            identifiertype: result.identifiertype.value,
            authors: result.authors.value
        }
    }
}

// used to merge proposal duplicated in the request as we also want to retrieve each of their classes
const structurePatterns = (results) => {
    const newPatterns = {};

    results.forEach(r => {
        if (newPatterns[r.pattern.value]) {
            if (newPatterns[r.pattern.value].variants[r.variant.value]) {
                if (newPatterns[r.pattern.value].variants[r.variant.value].proposals[r.proposal.value]) {
                    newPatterns[r.pattern.value].variants[r.variant.value].proposals[r.proposal.value].classes.push(r.parent.value);
                } else {
                    newPatterns[r.pattern.value].variants[r.variant.value].proposals[r.proposal.value] = {
                        ...parseProposal(r),
                        classes: [r.parent.value, r.pattern.value]
                    }
                }
            } else {
                newPatterns[r.pattern.value].variants[r.variant.value] = {
                    proposals: {
                        [r.proposal.value]: {
                            ...parseProposal(r),
                            classes: [r.parent.value, r.pattern.value]
                        }
                    },
                    label: r.variant_label.value
                }
            }
        } else {
            newPatterns[r.pattern.value] = {
                pattern: r.pattern.value,
                label: r.pattern_label.value,
                variants: {
                    [r.variant.value]: {
                        proposals: {
                            [r.proposal.value]: {
                                ...parseProposal(r),
                                classes: [r.parent.value, r.pattern.value]
                            }
                        },
                        label: r.variant_label.value
                    }
                }
            }
        }
    });

    return newPatterns;
};

const addScoreToPatterns = (patterns, filterProblems) => {
    const newPatterns = patterns.map(pattern => ({
        ...pattern,
        score: filterProblems[pattern.problem.value].score
    }));
    return newPatterns;
};

export const getPatternKnowledge = async () => {
    const query = `
        SELECT ?parent ?pattern ?variant ?proposal ?pattern_label ?variant_label ?proposal_label ?paper ?context ?solution ?title ?identifier ?identifiertype ?authors
        WHERE {
            ?proposal a ?parent .
            ?proposal a onto:Proposal .
            ?proposal onto:hasVariant ?variant .
            ?variant a ?pattern .
            ?pattern rdfs:subClassOf* onto:Pattern.
            ?pattern rdfs:label ?pattern_label .
            ?variant rdfs:label ?variant_label .
            ?proposal rdfs:label ?proposal_label .
            ?proposal onto:hasPaper ?paper .
            ?proposal onto:ContextAndProblem ?context .
            ?proposal onto:Solution ?solution.
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
            const grouped = structurePatterns(results);
            return grouped;
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
            SELECT distinct ?problem ?variant ?proposal ?pattern ?variant_label ?pattern_label ?proposal_label ?paper ?context ?solution ?title ?identifier ?identifiertype ?authors 
            WHERE {
                ?pattern rdfs:subClassOf* 
                    [ 
                    rdf:type owl:Restriction ;
                    owl:onProperty onto:addressProblem ;
                    owl:someValuesFrom ?problem
                    ].
                FILTER (?problem IN (${Object.keys(filterProblems).join(',')}) ).
                ?pattern rdfs:subClassOf* onto:Pattern.
                ?proposal onto:hasVariant ?variant .
                ?variant a ?pattern .
                ?pattern rdfs:label ?pattern_label.
                ?proposal rdfs:label ?proposal_label .
                ?variant rdfs:label ?variant_label .
                ?proposal onto:hasPaper ?paper .
                ?proposal onto:ContextAndProblem ?context .
                ?proposal onto:Solution ?solution.
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
                const mapped = scored.map(r => ({ ...parseProposal(r), score: r.score }));
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