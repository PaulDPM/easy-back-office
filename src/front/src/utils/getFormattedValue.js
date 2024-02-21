import evalExpression from "./evalExpression"
import {
    Link
} from "react-router-dom";

export default (column, record, config, onTable) => {
    const foreignViewIndex = column.dataType === 'foreign' ? config.views.findIndex(x => x.tableName === column.table) : -1
    if (column.dataType === 'foreign' && foreignViewIndex > -1) {
        if (column.formatValue) {
            return <Link to={`/record/${foreignViewIndex}/${record[column.name]}`} dangerouslySetInnerHTML={{ __html: record[`__formatValue-${column.__id__}__`] }} />
        } else if (column.formattedValue) {
            return <Link to={`/record/${foreignViewIndex}/${record[column.name]}`}>{evalExpression(column.formattedValue, record)}</Link>
        } else {
            return <Link to={`/record/${foreignViewIndex}/${record[column.name]}`}>{record[column.name]}</Link>
        }
    } else if (column.showAsPicture) {
        const imageUrl = column.baseUrl + record[column.pathField];
        return record[column.pathField] ? (
            <a href={imageUrl} target='_blank'>
                <img src={imageUrl} style={{ width: onTable ? 60 : 300, height: onTable ? 30 : 150, objectFit: "contain" }} />
            </a>
        ) : null
    } else if (column.formatValue) {
        return <div dangerouslySetInnerHTML={{ __html: record[`__formatValue-${column.__id__}__`] }} />
    } else if (column.formattedValue) {
        return <div>{evalExpression(column.formattedValue, record)}</div>
    } else if (column.action) {
        if (column.actionDisplayCondition) {
            let isDisplaying = evalExpression(column.actionDisplayCondition, record)
            if (!isDisplaying)
                return "";
        }
        var data = JSON.parse(JSON.stringify(column.data));
        for (var key in data) {
            data[key] = evalExpression(data[key], record)
        }
        return (
            <div class='actionButton' data-route='" + column.route + "' data-data='" + JSON.stringify(data) + "'>{column.action}</div>
        )
    } else if (column.dataType === "tinyint") {
        return <div>{record[column.name] === 1 ? "Oui" : "Non"}</div>
    } else if (column.dataType === "color") {
        return <div class='colorPreview' style={{ backgroundColor: record[column.name] }}></div>
    } else if (column.dataType === "richText" || column.dataType === "betterRichText") {
        return <div dangerouslySetInnerHTML={{ __html: record[column.htmlField] }} />
    } else if (column.dataType === "select" && column.options && column.options.constructor == Object) {
        return <div>{column.options[record[column.name]]}</div>
    } else {
        return <div>{record[column.name]}</div>
    }
}