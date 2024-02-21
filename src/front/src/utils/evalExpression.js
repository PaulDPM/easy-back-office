
export default (expression, data) => {
    try {
        var varString = '';
        for (var key in data) {
            varString += "var " + key + " = " + (typeof data[key] === "string" ? "'" + data[key].replace(/'/g, "\\'").replace(/\n/g, "<br>").replace(/\r/g, "") + "'" : (typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key])) + ";"
        }
        return eval(varString + expression)
    } catch (e) {
        console.log(varString + expression);
        console.error(e);
        return "Error"
    }
}