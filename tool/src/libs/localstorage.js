export const getFromLocalstorage = (key) => {
    try {
        const value = localStorage.getItem(key);
        if (value) {
            return JSON.parse(value);
        } else {
            setInLocalstorage('patterns', {});
            return {};
        }
    } catch {
        return false;
    }
};

export const storePatternInLocalstorage = (individual) => {
    let storedPatterns = localStorage.getItem('patterns');
    if (!storedPatterns) {
        localStorage.setItem('patterns', JSON.stringify({[individual.individual]: individual}));
    } else {
        localStorage.setItem('patterns', JSON.stringify({
            ...JSON.parse(storedPatterns),
            [individual.individual]: individual
        }));
    }
}

export const setInLocalstorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
}

export const getJSONFileContent = async file => {
    var jsonContent = {};
    const reader = new FileReader();

    await new Promise(resolve => {
        reader.onload = (e) => { 
            localStorage.clear();
            // must verify later that json provided is correct
            jsonContent = JSON.parse(e.target.result);
            resolve(true);
        };

        reader.readAsText(file);
    });
    
    return jsonContent;
}

export const setPatternsFromJSON = async filename => {
    const jsonPatterns = await getJSONFileContent(filename);
    localStorage.setItem('patterns', JSON.stringify(jsonPatterns));
    return jsonPatterns;
}

export const deleteAllLocalstoragePatterns = () => {
    localStorage.setItem('patterns', JSON.stringify({}));
};