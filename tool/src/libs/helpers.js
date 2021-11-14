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

export const parseToLabel = (uri) => {
   try {
    const splitUri = uri.split(':')[1];
    if (splitUri.length > 1) return splitUri[0].toUpperCase() + splitUri.slice(1).replace(/([A-Z])/g, ' $1').trim();
    else return splitUri[0].toUpperCase();
   } catch {
       return uri;
   }
}

export const exportToJSON = async (content, filename) => {
    const json = JSON.stringify(content);
    const blob = new Blob([json],{type:'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};