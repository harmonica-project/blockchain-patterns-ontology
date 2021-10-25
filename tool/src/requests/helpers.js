export const convertResultToMapping = (results) => {
    const newResults = {}
    
    results.forEach(res => {
        newResults[res.subject.value] = res;
    })

    return newResults;
}

export const parseResults = ({results}) => {
    if (results) {
        // takes as parameter the raw result from the query
        let newResults = [];
        let prefixes = [
            {"prefix": "rdf:", "uri": "http://www.w3.org/1999/02/22-rdf-syntax-ns#"},
            {"prefix": "rdfs:", "uri": "http://www.w3.org/2000/01/rdf-schema#"},
            {"prefix": "owl:", "uri": "http://www.w3.org/2002/07/owl#"},
            {"prefix": "xsd:", "uri": "http://www.w3.org/2001/XMLSchema#"},
            {"prefix": "onto:","uri": "http://www.semanticweb.org/nicolas/ontologies/2021/8/patterns#"},
        ];

        results.bindings.forEach(res => {
            let newBinding = []

            // iter on every key inside a binding and replace all occurences of prefixes
            for (const keyItem in res) {
                for (const keySubitem in res[keyItem]) {
                    for (const keyPrefix in prefixes) {
                        res[keyItem][keySubitem] = res[keyItem][keySubitem].replaceAll(prefixes[keyPrefix]['uri'], prefixes[keyPrefix]['prefix'])
                    }
                }

                newBinding = { ...newBinding, [keyItem]: res[keyItem]}
            }

            newResults.push(newBinding)
        })

        return newResults;
    } else {
        // result undefined or json empty
        return []
    }
}

export const getLocalStoragePatterns = () => {
    const newSelectedPatterns = {};
    const localStorageKeys = Object.keys(localStorage);

    for (let i in localStorageKeys) {
        newSelectedPatterns[localStorageKeys[i]] = JSON.parse(localStorage.getItem(localStorageKeys[i]));
    }

    return newSelectedPatterns;
};