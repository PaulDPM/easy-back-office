moment.locale("fr");
var currentTableNumberOfPages;
var searchTypingTimeout = null;
var currentRecordData = null;
var currentlyEditedRecord = null;

$(document).ready(function () {
    refreshNotifications()
    setInterval(refreshNotifications, 5000);

    showView(0)

    $(document).on("click touchstart", ".record[data-view-index][data-primary-value]", function () {
        var viewIndex = $(this).data("viewIndex")
        var position = $(this).data("position")
        var table = config.views[viewIndex];
        if (table.notClickable) {
            // nothing
        } else if (table.clickToEdit) {
            showEditRecord(viewIndex, $(this).data("primaryValue"))
        } else {
            showShowRecord(viewIndex, $(this).data("primaryValue"), position)
        }
    })

    $(document).on("click", ".actionButton", function () {
        $.post($(this).data("route"), $(this).data("data"), function () {
            showView(lastViewShown);
        })
    })

    $(document).on("click", ".duplicateRecord", function (e) {
        var viewIndex = $(this).data("viewIndex")
        var table = config.views[viewIndex];
        var primaryValue = $(this).data("primaryValue")
        $.post("duplicateRecord", {
            primaryValue: primaryValue,
            table: table.tableName,
            duplicateConfig: table.duplicateConfig
        }, function () {
            showRecords(lastViewShown, lastPageShown, lastSearchQuery, lastOrderBy, lastIsDesc, lastSubviewIndex)
        })
    })

    $(document).on("click", ".galleryPicture .deleteIcon", function (e) {
        var $elementToRemove = $(this).parent()
        var tableName = $(this).data("tableName")
        var primaryId = $(this).data("primaryId")
        var primaryValue = $(this).data("primaryValue")
        askForDeletion(tableName, primaryId, null, primaryValue, function () {
            $elementToRemove.remove()
        })
        e.stopPropagation()
    })

    $(document).on("click", ".unfoldPanel", function () {
        $(this).parent().parent().parent().find(".panelTable").toggleClass("folded")
        $(this).html($(this).html() == "Afficher" ? "Masquer" : "Afficher")
    })

    $(".searchBar").on("input", function (e) {
        if (searchTypingTimeout) {
            clearTimeout(searchTypingTimeout);
        }
        searchTypingTimeout = setTimeout(search, 300);
    })

    $(".prevButton").on("click", function () {
        showAdjacent(true)
    });

    $(".nextButton").on("click", function () {
        showAdjacent()
    });
})

function initFileInputs() {
    $(".clickToSelectFile").each(function () {
        var showAsPicture = $(this).data("showAsPicture") == 1
        var filePath = $("input[data-input-id='" + $(this).data("inputId") + "'][name='filePath']").val()
        if (filePath) {
            $(this).html(showAsPicture ? "<div><img src='https://res.cloudinary.com/forest2/image/fetch/w_600,h_300,c_fit/" + $(this).data("baseUrl") + filePath + "' /><div class='deleteFile'><i class='fal fa-trash-alt'></i></div></div>" : "<div class='nonImageFileOutput'><span>Fichier téléchargé</span><div class='deleteFile'><i class='fal fa-trash-alt'></i></div></div>")
            $(this).removeClass("clickToSelectFile")
        }
    })
}

function defineTriggers(input, column, isEdit) {
    if (column.triggers) {
        input.on("input", function () {
            for (let i in column.triggers) {
                let trigger = column.triggers[i];
                if (trigger.computedValue) {
                    $("input[data-column-name=" + trigger.name + "]").val(evalExpression(trigger.computedValue, getCurrentValues(isEdit)))
                } else if (trigger.type === "refreshList") {
                    let viewIndex = input.attr("data-view-index");
                    let otherColumn = config.views[viewIndex].columns.find(x => x.name == trigger.name)
                    $("[data-column-name=" + trigger.name + "] .datalistContainerInput").val("")
                    $("[data-column-name=" + trigger.name + "] .datalistContainerHiddenInput").val("")
                    initForeignSelect(otherColumn, $("[data-column-name=" + trigger.name + "] datalist"), null, null, null, isEdit)
                }
            }
        })
    }
}

var currentRecordPrimaryValue = null;
var currentRecordViewIndex = null;
var currentRecordPosition = null;

function showAdjacent(isPrev) {
    var view = config.views[currentRecordViewIndex];

    $.post("adjacentRecordId", {
        position: parseInt(currentRecordPosition),
        table: view.tableName,
        filters: sqlAnd([view.filters, lastSubviewIndex != null ? view.subviews[lastSubviewIndex].filters : null].concat(currentFilters.map(function (x) {
            return x.query
        }))),
        join: view.join,
        selectExpression: view.selectExpression,
        orderBy: lastOrderBy || view.orderBy,
        isDesc: typeof lastIsDesc == "undefined" || lastIsDesc === null ? view.isDesc : lastIsDesc,
        primaryId: view.primaryId,
        query: lastSearchQuery,
        groupBy: view.groupBy,
        columns: view.columns,
        offset: isPrev ? -1 : 1
    }, function (data) {
        if (data.recordId) {
            showShowRecord(currentRecordViewIndex, data.recordId, isPrev ? Math.max(currentRecordPosition - 1, 1) : currentRecordPosition + 1)
        }
    });
}

function showShowRecord(viewIndex, primaryValue, position) {
    currentRecordPosition = position;
    if (isFinite(position)) {
        $(".adjacentButton").show();
    } else {
        $(".adjacentButton").hide();
    }
}

function showCreateRecordFromPanel(createConfig, recordId, viewIndex) {
    pushHistoryState()
    $(".view").hide()
    $(".view[data-view='createRecord']").show()
    let columns = createConfig.columns
    $(".viewTitle").html(createConfig.label)
    let $form = $(".view[data-view='createRecord'] .form")
    $(".view[data-view='createRecord'] .createRecord").data("viewIndex", viewIndex)
    $(".view[data-view='createRecord'] .createRecord").off('click');
    $(".view[data-view='createRecord'] .createRecord").on("click", function (e) {
        createRecordFromPanel(createConfig, recordId, viewIndex)
        e.stopPropagation()
    })
    $form.html("")
    for (let i in columns) {
        if (columns[i].dataType && (columns[i].canEditOnCreation === true || columns[i].canEdit !== false)) {
            let $formElement = $("<div class='formElement'>" +
                "<div class='formLabel'>" + columns[i].label + "</div>" +
                "<div class='formInput'></div>" +
                "</div>")
            let $input = getInputFromDataType(columns[i].dataType, columns[i])
            $input.attr("data-column-name", columns[i].name)
            $input.data("columnName", columns[i].name)
            $formElement.find(".formInput").append($input)
            $form.append($formElement)
            if (columns[i].dataType == "foreign") {
                initForeignSelect(columns[i], $input, null, null, recordId)
            } else if (columns[i].dataType == "datalist") {
                initForeignSelect(columns[i], $input.find("datalist"), null, null, recordId)
                $input.find(".datalistContainerInput").on("input", function () {
                    initForeignSelect(columns[i], $input.find("datalist"), null, $(this).val(), recordId)
                })
            }
            if (columns[i].hidden) {
                $formElement.hide()
            }
        }
    }
    initSpecialInputs()
}

function createRecordFromPanel(createConfig, recordId, viewIndex) {
    var $form = $(".view[data-view='createRecord'] .form")
    var data = {}
    $form.find("[data-column-name]").each(function () {
        data[$(this).data("columnName")] = $(this).val()
    })
    for (var key in createConfig.filters) {
        data[key] = createConfig.filters[key]
    }
    data[createConfig.recordId] = recordId
    $(".createRecord").html("Sauvegarde en cours...")
    $(".createRecord").addClass("loading")
    $.post("createRecord", {
        table: createConfig.tableName,
        data: data
    }, function (r) {
        $(".createRecord").html("Sauvegarder")
        $(".createRecord").removeClass("loading")
        if (createConfig.createCallback) {
            $.post(createConfig.createCallback, {
                id: r.id
            })
        }
        showShowRecord(viewIndex, recordId)
    })
}

function refreshNotifications() {
    for (var i in config.views) {
        let view = config.views[i];
        if (view.notificationCount) {
            $.post("records", {
                table: view.tableName,
                page: 1,
                filters: sqlAnd([view.filters, view.notificationCount]),
                join: view.join,
                selectExpression: view.selectExpression,
                primaryId: view.primaryId,
                groupBy: view.groupBy,
                columns: view.columns,
                limit: 10,
            }, function (data) {
                if (data.count > 0) {
                    $(".notificationWrapper[data-view='" + view.label + "']").css("display", "flex")
                    $(".notificationWrapper[data-view='" + view.label + "']").html(data.count);
                } else {
                    $(".notificationWrapper[data-view='" + view.label + "']").hide()
                }
            })
        }
        if (view.subviews) {
            for (let subview of view.subviews) {
                if (subview.notificationCount) {
                    $.post("records", {
                        table: view.tableName,
                        page: 1,
                        filters: sqlAnd([view.filters, subview.filters, subview.notificationCount]),
                        join: view.join,
                        selectExpression: view.selectExpression,
                        primaryId: view.primaryId,
                        groupBy: view.groupBy,
                        columns: view.columns,
                        limit: 10,
                    }, function (data) {
                        if (data.count > 0) {
                            $(".notificationWrapperForSubview[data-subview='" + subview.label + "']").css("display", "flex")
                            $(".notificationWrapperForSubview[data-subview='" + subview.label + "']").html(data.count);
                        } else {
                            $(".notificationWrapperForSubview[data-subview='" + subview.label + "']").hide()
                        }
                    })
                }
            }
        }
    }
}