const FUSEKI_URL = "http://localhost:3030/result/query"

const OPTIONS = {
    method: 'POST',
    body: "query=SELECT ?subject ?predicate ?object WHERE {   ?subject ?predicate ?object } LIMIT 25",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    }
};

export const health_check = async () => {
    let response = await fetch( FUSEKI_URL, OPTIONS );
    if (response.status == 200) return true;
    return false;
}