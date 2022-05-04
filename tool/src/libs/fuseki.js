import { parseResults } from './helpers';

const FUSEKI_URL = "https://sparql.nextnet.top/ontotoolv2/query"
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
const structurePatterns = (patterns, pCitations, vCitations, prCitations) => {
    const newPatterns = {};
    const pCitationsDict = {}
    const vCitationsDict = {}
    const prCitationsDict = {}

    pCitations.forEach(citation => pCitationsDict[citation.pattern.value] = parseInt(citation.citations.value));
    vCitations.forEach(citation => vCitationsDict[citation.variant.value] = parseInt(citation.citations.value));
    prCitations.forEach(citation => prCitationsDict[citation.proposal.value] = parseInt(citation.citations.value));

    patterns.forEach(r => {
        if (newPatterns[r.pattern.value]) {
            if (newPatterns[r.pattern.value].variants[r.variant.value]) {
                if (newPatterns[r.pattern.value].variants[r.variant.value].proposals[r.proposal.value]) {
                    newPatterns[r.pattern.value].variants[r.variant.value].proposals[r.proposal.value].classes.push(r.parent.value);
                } else {
                    newPatterns[r.pattern.value].variants[r.variant.value].proposals[r.proposal.value] = {
                        ...parseProposal(r),
                        classes: [r.parent.value, r.pattern.value],
                        citations: prCitationsDict[r.proposal.value] ?? 0
                    }
                }
            } else {
                newPatterns[r.pattern.value].variants[r.variant.value] = {
                    proposals: {
                        [r.proposal.value]: {
                            ...parseProposal(r),
                            classes: [r.parent.value, r.pattern.value],
                            citations: prCitationsDict[r.proposal.value] ?? 0
                        }
                    },
                    label: r.variant_label.value,
                    citations: vCitationsDict[r.variant.value] ?? 0,
                }
            }
        } else {
            newPatterns[r.pattern.value] = {
                pattern: r.pattern.value,
                label: r.pattern_label.value,
                citations: pCitationsDict[r.pattern.value] ?? 0,
                variants: {
                    [r.variant.value]: {
                        proposals: {
                            [r.proposal.value]: {
                                ...parseProposal(r),
                                classes: [r.parent.value, r.pattern.value],
                                citations: prCitationsDict[r.proposal.value] ?? 0
                            }
                        },
                        label: r.variant_label.value,
                        citations: vCitationsDict[r.variant.value] ?? 0,
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

const getPatterns = async () => {
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
            return parseResults(await response.json());
        };
        return [];
    } catch (e) {
        console.error('Failed to fetch: ' + e);
        return [];
    }
}

export const getPatternKnowledge = async () => {
    const patterns = await getPatterns();
    const pCitations = await getPatternsCitations();
    const vCitations = await getVariantsCitations();
    const prCitations = await getProposalCitations();

    if (patterns.length) {
        const grouped = structurePatterns(patterns, pCitations, vCitations, prCitations);
        return grouped;
    } else return [];
}

const getPatternsCitations = async () => {
    let query = `
        SELECT ?pattern (COUNT(*) as ?citations)
        WHERE {
            ?pattern rdfs:subClassOf* onto:Pattern .
            ?variant a ?pattern .
            ?variant onto:hasProposal ?proposal .
            ?proposal onto:hasPaper ?paper .
            ?paper onto:hasIdentifier ?identifier .
            ?target onto:references ?identifier
        } GROUP BY ?pattern 
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
}

const getVariantsCitations = async () => {
    let query = `
        SELECT ?variant (COUNT(*) as ?citations)
        WHERE {
            ?variant a onto:Variant .
            ?variant onto:hasProposal ?proposal .
            ?proposal onto:hasPaper ?paper .
            ?paper onto:hasIdentifier ?identifier .
            ?target onto:references ?identifier
        } GROUP BY ?variant 
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
}

const getProposalCitations = async () => {
    let query = `
    SELECT ?proposal (COUNT(*) as ?citations)
    WHERE {
        ?proposal onto:hasPaper ?paper .
        ?paper onto:hasIdentifier ?identifier .
        ?target onto:references ?identifier
    } GROUP BY ?proposal 
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
                const citations = await getProposalCitations();
                const citationsDict = {};

                citations.forEach(citation => citationsDict[citation.proposal.value] = parseInt(citation.citations.value));
                const mapped = scored.map(r => ({ ...parseProposal(r), score: r.score, citations: citationsDict[r.proposal.value] ? parseInt(citationsDict[r.proposal.value]) : 0 }));
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