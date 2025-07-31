function removeFields(value: any, fieldsToRemove: string[]): any {
    if (Array.isArray(value)) {
        return value.map(item => removeFields(item, fieldsToRemove));
    }

    if (value !== null && typeof value === 'object') {
        const result: any = {};
        for (const [key, val] of Object.entries(value)) {
            if (!fieldsToRemove.includes(key)) {
                result[key] = removeFields(val, fieldsToRemove);
            }
        }
        return result;
    }

    return value;
}

export function removeFieldsMiddleware(fieldsToRemove: string[]) {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = (body: any) => {
            const cleaned = removeFields(body, fieldsToRemove);
            return originalJson(cleaned);
        };

        next();
    };
}