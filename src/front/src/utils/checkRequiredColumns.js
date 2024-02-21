function isNotFilled(x) {
    return x === undefined || x === null || x === ''
}

export default (columns, data) => {
    const requiredUnfilledColumns = columns.filter(column => column.required && isNotFilled(data[column.name]))
    if (requiredUnfilledColumns.length > 0) {
        let message;
        if (requiredUnfilledColumns.length == 1) {
            message = `Le champ requis ${requiredUnfilledColumns.map(x => x.label).join(", ")} n'a pas été rempli`
        } else {
            message = `Les champs requis ${requiredUnfilledColumns.map(x => x.label).join(", ")} n'ont pas été remplis`
        }
        window.swal({
            title: "Erreur",
            text: message,
            dangerMode: true
        })
        return false;
    }
    return true;
}