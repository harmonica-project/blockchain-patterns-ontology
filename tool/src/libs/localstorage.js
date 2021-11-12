export const getLocalstoragePatterns = () => {
    try {
        return JSON.parse(localStorage.getItem('patterns'));
    } catch {
        return false;
    }
};

export const storePatternInLocalstorage = (pattern) => {
    let storedPatterns = localStorage.getItem('patterns');
    if (!storedPatterns) {
        localStorage.setItem('patterns', JSON.stringify({[pattern.individual.value]: pattern}));
    } else {
        localStorage.setItem('patterns', JSON.stringify({
            ...JSON.parse(storedPatterns),
            [pattern.individual.value]: pattern
        }));
    }
}

export const setPatternsInLocalstorage = (patterns) => {
    localStorage.setItem('patterns', JSON.stringify(patterns));
}

export const setPatternsFromJSON = async e => {
    e.preventDefault()
    var jsonPatterns = {}
    const reader = new FileReader()

    await new Promise(resolve => {
        reader.onload = (e) => { 
            localStorage.clear();
            const text = (e.target.result)
            // must verify later that json provided is correct
            jsonPatterns = JSON.parse(text);
            localStorage.setItem('patterns', JSON.stringify(jsonPatterns));
            resolve(true);
        };

        reader.readAsText(e.target.files[0]);
    });
    
    return jsonPatterns;
}

export const deleteAllLocalstoragePatterns = () => {
    localStorage.setItem('patterns', JSON.stringify({}));
};