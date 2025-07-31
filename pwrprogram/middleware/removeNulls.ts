// removeNullsMiddleware.js
function removeNulls(obj) {
    if (Array.isArray(obj)) {
        return obj
            .map(removeNulls)
            .filter(item => item !== null && item !== undefined);
    } else if (obj !== null && typeof obj === 'object') {
        const cleaned = {};
        for (const [key, val] of Object.entries(obj)) {
            const cleanedVal = removeNulls(val);
            if (cleanedVal !== null && cleanedVal !== undefined) {
                cleaned[key] = cleanedVal;
            }
        }
        return cleaned;
    }
    return obj;
}

export function removeNullsMiddleware(req, res, next) {
    const originalJson = res.json;
    console.log('Applying removeNullsMiddleware');
    // Override the res.json method to clean the object before sending it
    res.json = function (body) {
        console.log('Original response body:', body);
        // If the body is an object or array, clean it
        if (typeof body === 'object' && body !== null) {
            body = removeNulls(body);
        }
        // Call the original res.json() with the cleaned object
        originalJson.call(this, body);
        console.log('Response body after cleaning:', body);
    };



    next();
}