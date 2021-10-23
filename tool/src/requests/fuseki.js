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

const filterParents = (filterClasses) => {
    let keyClasses = Object.keys(filterClasses);

    for (let i in keyClasses) {
        let key = keyClasses[i]
        console.log(key, filterClasses[key], filterClasses[filterClasses[key]])
        if (filterClasses[filterClasses[key]]) {
            delete filterClasses[key];
        }
    }

    return filterClasses;
}

export const getPatterns = async (filterClasses) => {
    let newFilterClasses = filterParents({...filterClasses});
    let query = "";

    console.log(newFilterClasses);
    const alpha = Array.from(Array(26)).map((e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x)).slice(1);

    const additionalClassTemplate = (additionalClass, additionalIdentifier) => {
        return `?${additionalIdentifier} rdfs:subClassOf* ${additionalClass}.`
    };

    const additionalIdentifierTemplate = (additionalIdentifier) => {
        return `, ?${additionalIdentifier}`
    };

    const queryTemplate = (additionalIdentifiers = "", additionalClasses = "") => {
        return `SELECT DISTINCT ?entity ?label ?hasPaper
                    WHERE {
                        ?A rdfs:subClassOf* onto:Pattern.
                        ${additionalClasses}
                        ?individual a ?A ${additionalIdentifiers} .
                        OPTIONAL { ?individual rdfs:label ?label }
                        OPTIONAL { ?individual onto:hasPaper ?hasPaper }
                    }
                `
    }
    
    if (Object.keys(newFilterClasses).length === 0) {
        query = queryTemplate()
    } else {
        let additionalClasses = "";
        let additionalIdentifiers = "";

        Object.keys(newFilterClasses).forEach((key, i) => {
            additionalClasses += additionalClassTemplate(newFilterClasses[key], alphabet[i]);
            additionalIdentifiers += additionalIdentifierTemplate(alphabet[i]);
        })
        query = queryTemplate(additionalIdentifiers, additionalClasses);
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