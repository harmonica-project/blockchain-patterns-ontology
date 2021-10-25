import { parseResults, convertResultToMapping } from '../requests/helpers';

const FUSEKI_URL = "http://localhost:3030/result/query"
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
            ?subject rdfs:subClassOf ${className}
            OPTIONAL {
                ?subject rdfs:label ?label
            }
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

export const getPatterns = async (filterClasses = {}) => {
    let query = "";

    const additionalClassTemplate = (additionalClass) => {
        return `?classuri rdfs:subClassOf* ${additionalClass}.`
    };

    const queryTemplate = (additionalClasses = "") => {
        return `SELECT DISTINCT ?classuri ?individual ?entity ?label ?paper ?context ?solution
                    WHERE {
                        ?classuri rdfs:subClassOf* onto:Pattern.
                        ${additionalClasses}
                        ?individual a ?classuri .
                        ?individual rdfs:label ?label .
                        ?individual onto:hasPaper ?paper .
                        ?individual onto:ContextAndProblem ?context .
                        ?individual onto:Solution ?solution
                    }
                `
    }
    
    if (Object.keys(filterClasses).length === 0) {
        query = queryTemplate()
    } else {
        let additionalClasses = "";

        Object.keys(filterClasses).forEach((key, i) => {
            additionalClasses += additionalClassTemplate(filterClasses[key]);
        })
        query = queryTemplate(additionalClasses);
    }

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