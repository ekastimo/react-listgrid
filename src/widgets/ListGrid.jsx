import React from 'react';
import dataCache  from "../utils/DataCache.jsx";
import Pagination from "react-js-pagination";

export default class ListGrid extends React.Component {
    constructor(props) {
        super(props);
        this.tableConfig = this.props.config;
        this.rawData = this.props.data;
        this.primaryKey = this.tableConfig.primaryKey;
        this.columns = this.tableConfig.columns.filter((col) => {
            return col.showOnGrid
        });
        //Local to List grid
        this.selectedData = {};
        this.criteria = {};

        this.state = {
            itemsCountPerPage: 10,
            isRowsSelected: false,
            displayData: [...this.rawData],
            sortDir: null,//ASC/DESC
            sortBy: null,
            currentPage: 1
        };
    }

    componentWillReceiveProps(props) {
        if (props.tableConfig) {
            this.selectedData = {};
            this.rawData = props.tableData;
            this.setState({displayData: this.rawData.slice(0)});
        }
    }

    refresh() {
        //TODO Implement refresh
    }

    addRecord(rec) {
        console.log("Adding New Record>>");
        console.log(rec);
        this.refresh();
    }

    handleRowsSelect(event) {
        this.onRowsSelectionStateChange(!this.state.isRowsSelected);
        this.setState({isRowsSelected: !this.state.isRowsSelected});
    }

    onRowsSelectionStateChange(selected) {
        const displayData = this.getDisplayData();
        if (selected) {
            displayData.forEach((rec) => {
                this.selectedData[rec[this.primaryKey]] = rec;
            });
        } else {
            displayData.forEach((rec) => {
                delete this.selectedData[rec[this.primaryKey]];
            });
        }
    }

    /**
     * Sort Only the displayed Data
     * @param colName
     */
    onSort(colName) {
        let sortDir = this.state.sortDir;
        const sortBy = colName;
        if (sortBy === this.state.sortBy) {
            sortDir = this.state.sortDir === 'ASC' ? 'DESC' : 'ASC';
        } else {
            sortDir = 'DESC';
        }
        const rows = [...this.state.displayData];
        rows.sort((a, b) => {
            let sortVal = 0;
            if (a[sortBy] > b[sortBy]) {
                sortVal = 1;
            }
            if (a[sortBy] < b[sortBy]) {
                sortVal = -1;
            }

            if (sortDir === 'DESC') {
                sortVal = sortVal * -1;
            }
            return sortVal;
        });

        this.setState({sortBy, sortDir, displayData: rows});
    }

    onFilter(colName, event) {
        const criteria = this.criteria;
        criteria[colName] = event.target.value.toString().toLowerCase();
        console.log(criteria);
        const size = this.rawData.length;
        const filteredList = [];
        for (let index = 0; index < size; index++) {
            // match Data against All Criterion
            const matches = Object.keys(criteria).every((key) => {
                let colValue = this.rawData[index][key];
                return colValue.toString().toLowerCase().indexOf(criteria[key]) !== -1;
            });
            //Record Matches all checks
            if (matches) {
                filteredList.push(this.rawData[index]);
            }
        }
        //On filter set Current Page to One To avoid too large page Number
        this.setState({
            currentPage: 1,
            displayData: filteredList,
        });
    }

    onPagerChanged(page) {
        this.setState({
            currentPage: page,
        });
    }

    getDisplayData() {
        const end = this.state.itemsCountPerPage * this.state.currentPage;
        const start = end - this.state.itemsCountPerPage;
        const pageData = [];
        for (let index = start; index < end; index++) {
            const obj = this.state.displayData[index];
            obj && pageData.push(obj);
        }
        return pageData;
    }

    rowSelectedHandler(data) {
        this.selectedData[data[this.primaryKey]] = data;
    }

    rowUnSelectedHandler(data) {
        delete this.selectedData[data[this.primaryKey]];
    }

    getSelectedRecords() {
        const data = this.selectedData;
        const toReturn = [];
        for (let key in data)
            if (data.hasOwnProperty(key))
                toReturn.push(data[key]);
        return toReturn
    }

    onRefreshClicked() {
        console.log("Refresh Clicked...");
        this.refresh();
    }

    onNewClicked() {
        this.props.onNewClickedHandler();
    }

    onEditClicked() {
        console.log("Edit Clicked");
        const recs = this.getSelectedRecords();
        if (recs.length !== 1) {
            dataCache.warn("Please select one record to edit");
        } else {
            this.props.onDataEditHandler(recs[0]);
        }
    }

    onAdvancedEditClicked() {
        console.log("Advanced Edit Clicked");
        const recs = this.getSelectedRecords();
        if (recs.length !== 1) {
            dataCache.warn("Please select one record to edit");
        } else {
            this.props.onDataAdvancedEditHandler(recs[0]);
        }
    }

    onDeleteClicked() {
        console.log("Delete Clicked...");
        const callBack = (data) => {
            this.refresh();
        };
        const recs = this.getSelectedRecords();
        if (recs.length !== 1) {
            dataCache.warn("Please select one record to edit");
            return;
        }
        $.ajax({
            type: "GET",
            url: this.tableConfig.deletePath + recs[0][this.primaryKey],
            dataType: 'json',
            cache: false,
            success: function (dt) {
                if (dt.status) {
                    dataCache.info(dt.message);
                    callBack(recs[0]);
                } else {
                    dataCache.error(dt.message);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                dataCache.serverError(xhr, status, err);
            }.bind(this)
        });
    }

    render() {
        const displayData = this.getDisplayData();
        return (
            <div className="panel panel-default " style={{
                margin: 0,
                height: '100%',
                width: '100%'
            }}>
                <div className="panel-body " style={{
                    margin: '0',
                    height: 'calc(100% - 40px)',
                    width: '100%',
                    padding: '5px'
                }}>
                    <div style={{
                        height: '30px',
                        width: '100%'
                    }}>
                        <input type="number" min={1} value={this.state.itemsCountPerPage} style={{
                            width: '50px'
                        }} onChange={(event) => {
                            this.setState({itemsCountPerPage: event.target.value});
                        }}/>
                        <div className="btn-group" style={{
                            height: '30px',
                            width: 'calc(100% - 50px)'
                        }}>

                            {
                                <button type="button" className="btn btn-default btn-sm"
                                        onClick={this.onRefreshClicked.bind(this)}>
                                    <span className="glyphicon glyphicon-refresh"/>
                                    &nbsp;Refresh
                                </button>
                            }
                            { this.props.onNewClickedHandler &&
                            <button type="button" className="btn btn-default btn-sm"
                                    onClick={this.onNewClicked.bind(this)}>
                                <span className="glyphicon glyphicon-plus"/>
                                &nbsp;New
                            </button>
                            }
                            {this.props.onDataEditHandler &&
                            <button type="button" className="btn btn-default btn-sm"
                                    onClick={this.onEditClicked.bind(this)}>
                                <span className="glyphicon glyphicon-pencil"/>
                                &nbsp;Edit
                            </button>
                            }
                            {this.props.onDataAdvancedEditHandler &&
                            <button type="button" className="btn btn-default btn-sm"
                                    onClick={this.onAdvancedEditClicked.bind(this)}>
                                <span className="glyphicon glyphicon-pencil"/>
                                &nbsp;{this.props.extraButton}
                            </button>
                            }
                            {this.tableConfig.deletePath &&
                            <button type="button" className="btn btn-default btn-sm"
                                    onClick={this.onDeleteClicked.bind(this)}>
                                <span className="glyphicon glyphicon-trash"/>
                                &nbsp;Delete
                            </button>
                            }
                        </div>
                    </div>

                    <div style={{
                        height: 'calc(100% - 30px)',
                        width: '100%'
                    }}>
                        <table className="table table-striped table-condensed table-hover table-bordered" style={{
                            marginBottom: '0'
                        }}>
                            <thead>
                            <tr style={{
                                background: '#ebebeb'
                            }}>
                                <th className="listgrid-check-box ">
                                    <input type="checkbox"
                                           onChange={this.handleRowsSelect.bind(this)}/></th>
                                {this.columns.map((col) => {
                                    let sortDirArrow = <span >&nbsp;&nbsp;</span>;
                                    if (this.state.sortBy === col.name && this.state.sortDir !== null) {
                                        sortDirArrow = this.state.sortDir === 'DESC'
                                            ? <span className="glyphicon glyphicon-arrow-down"/>
                                            : <span className="glyphicon glyphicon-arrow-up"/>;
                                    }
                                    return <th key={col.name} className="listgrid-body-cell">
                            <span
                                style={{
                                    width: 100
                                }}
                                onClick={() => this.onSort(col.name)}
                            >{col.title }{sortDirArrow}</span>
                                        <div>
                                            <input className="listgrid-filter-item"
                                                   onChange={this.onFilter.bind(this, col.name) }/>
                                        </div>
                                    </th>
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {displayData.map((data) => {
                                return (
                                    <Row
                                        key={data[this.primaryKey]}
                                        primaryKey={this.primaryKey}
                                        columns={this.columns}
                                        isRowsSelected={this.state.isRowsSelected}
                                        rowSelectedHandler={this.rowSelectedHandler.bind(this)}
                                        rowUnSelectedHandler={this.rowUnSelectedHandler.bind(this)}
                                        data={data}
                                    />
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="panel-footer " style={{
                    margin: 0,
                    height: '40px',
                    padding: "5px",
                }}>
                    <Pager
                        itemsCountPerPage={this.state.itemsCountPerPage}
                        totalItemsCount={this.state.displayData.length}
                        pageRangeDisplayed={5}
                        changeHandler={this.onPagerChanged.bind(this)}
                    />
                </div>
            </div>

        );
    }
}

class Row extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSelected: false
        };
        this.localUpdate = true;
    }

    handleRowClick(event) {
        this.localUpdate = true;
        this.onRowSelectionStateChange(!this.state.isSelected, this.props.data);
        this.setState({isSelected: !this.state.isSelected});

    }

    onRowSelectionStateChange(selected, rowData) {
        if (selected) {
            this.props.rowSelectedHandler && this.props.rowSelectedHandler(rowData);
        } else {
            this.props.rowUnSelectedHandler && this.props.rowUnSelectedHandler(rowData);
        }
    }

    render() {
        //Respect loacal Updates
        const selected = this.localUpdate ? this.state.isSelected : this.props.isRowsSelected;
        this.state.isSelected = selected;
        this.localUpdate = false;
        return (
            <tr
                key={this.props.data[this.props.primaryKey]}
                onClick={this.handleRowClick.bind(this)}
            >
                <td
                    className={"listgrid-check-box listgrid-body-cell " + (selected ? "listgrid-row-selected" : "") }
                ><CheckBox
                    onClick={this.handleRowClick.bind(this)}
                    checked={selected}
                /></td>
                {this.props.columns.map((col) => {
                    return <td
                        key={col.name}
                        className={"listgrid-body-cell " + (selected ? "listgrid-row-selected" : "")}
                    >{this.props.data[col.name]}
                    </td>
                })}
            </tr>
        );
    }
}

class CheckBox extends React.Component {
    render() {
        if (this.props.checked)
            return <input
                type="checkbox" onChange={this.props.onChange}
                checked="true" defaultValue="Hello!"
            />;
        else
            return <input
                type="checkbox" onChange={this.props.onChange}
                defaultValue="Hello!"
            />;
    }
}

class Pager extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activePage: 1
        };
    }

    handlePageChange(pageNumber) {
        console.log(`active page is ${pageNumber}`);
        this.setState({activePage: pageNumber});
        this.props.changeHandler(pageNumber);
    }

    render() {
        return (
            <Pagination
                activePage={this.state.activePage}
                itemsCountPerPage={this.props.itemsCountPerPage}
                totalItemsCount={this.props.totalItemsCount}
                pageRangeDisplayed={this.props.pageRangeDisplayed}
                onChange={this.handlePageChange.bind(this)}
            />
        );
    }
}


