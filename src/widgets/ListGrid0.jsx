import React from 'react';
import Pagination from "react-js-pagination";
const styles = {
    checkBox: {
        width: '40px'
    },
    rowSelected: {
        backgroundColor: '#ddd1e7'
    }
};
export default class ListGrid0 extends React.Component {
    constructor(props) {
        super(props);
        this.tableConfig = this.props.config;
        this.rawData = this.props.data;
        this.primaryKey = this.tableConfig.primaryKey;
        this.columns = this.tableConfig.columns.filter((col) => {
            return col.showOnGrid
        });
        //Local to List grid
        /**
         * Store Ids of the selected Data
         * @type {{}}
         */
        this.criteria = {};
        this.isPaged = this.props.isPaged || false;
        this.state = {
            itemsCountPerPage: 10,
            allRowsSelected: false,
            displayData: [...this.rawData],
            selectedData: {},
            sortDir: "ASC",//ASC/DESC
            sortBy: this.primaryKey,
            currentPage: 1,
            showFilter: true
        };
    }

    componentWillReceiveProps(props) {
        if (props.tableConfig) {
            this.rawData = props.tableData;
            let displayData = [...this.rawData];
            this.setState({displayData: displayData, selectedData: {}});
        }
    }

    onSelectAllRows(selected) {
        if (selected) {
            const selectedData = {};
            this.state.displayData.forEach(rec => {
                let pk = rec[this.primaryKey];
                selectedData[pk] = true;
            });
            this.setState({selectedData: selectedData});
        } else {
            this.setState({selectedData: {}});
        }
    }

    onSelectOneRow(selected, rowPk) {
        const selectedData = {...this.state.selectedData};
        selectedData[rowPk] = selected;
        this.setState({selectedData: selectedData});
    }


    sortData(rows, sortBy, sortDir) {
        console.log("Sorting...", sortBy + " " + sortDir);
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
        return rows;
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
        let sortedData = this.sortData(this.state.displayData, sortBy, sortDir);
        this.setState({sortBy, sortDir, displayData: sortedData});
    }

    filterData(criteria) {
        console.log("Filtering..", criteria);
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
        return filteredList;
    }

    onFilter(colName, event) {
        const criteria = this.criteria;
        criteria[colName] = event.target.value.toString().toLowerCase();
        const size = this.rawData.length;
        const filteredList = this.filterData(criteria);
        //On filter set Current Page to 1 lest records disappear
        this.setState({currentPage: 1, displayData: filteredList});
    }

    onPagerChanged(page) {
        this.setState({
            currentPage: page,
        });
    }

    getPagedData() {
        if (!this.isPaged) {
            return this.state.displayData;
        }
        const end = this.state.itemsCountPerPage * this.state.currentPage;
        const start = end - this.state.itemsCountPerPage;
        const pageData = [];
        for (let index = start; index < end; index++) {
            const obj = this.state.displayData[index];
            obj && pageData.push(obj);
        }
        return pageData;
    }

    createTableHead() {
        return (
            <thead>
            <tr style={{
                background: '#ebebeb'
            }}>

                <th style={styles.checkBox}>
                    <CheckBox onValueChanged={this.onSelectAllRows.bind(this)}/>
                </th>

                {this.columns.map((col) => {
                    let sortDirArrow = <span >&nbsp;&nbsp;</span>;
                    if (this.state.sortBy === col.name && this.state.sortDir !== null) {
                        sortDirArrow = (this.state.sortDir === 'DESC')
                            ? <span className="glyphicon glyphicon-arrow-down"/>
                            : <span className="glyphicon glyphicon-arrow-up"/>;
                    }
                    return (
                        <th key={col.name} className="listgrid-body-cell">
                                <span style={{width: 100}} onClick={() => this.onSort(col.name)}>
                                    {col.title }{sortDirArrow}
                                </span>
                                {
                                    this.state.showFilter &&
                                    <div>
                                        <input style={{
                                            width: '90%',
                                            height: '25px',
                                            borderRadius: '3px',
                                            margin: '0 auto 0 auto',
                                        }} onChange={this.onFilter.bind(this, col.name) }/>
                                    </div>
                                }
                        </th>
                    )
                })}
            </tr>
            </thead>
        );
    }

    createControlPanel() {
        return (
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
                    { this.props.controls }
                </div>
            </div>
        );
    }

    getSelectedRecords() {
        let _self = this;
        return _self.state.displayData.filter(rec => {
            let pkValue = rec[_self.primaryKey];
            return _self.state.selectedData[pkValue] || false;
        });
    }

    invalidateCache() {
        let hasCrit = (Object.keys(this.criteria).length > 0);
        let filteredData = hasCrit ? this.filterData(this.criteria) : this.rawData;
        let sortBy = this.state.sortBy;
        let sortDir = this.state.sortDir;
        if (sortBy) {
            filteredData = this.sortData([...filteredData], sortBy, sortDir)
        }
        this.setState({displayData: filteredData});
    }

    setNewRecords(data) {
        console.debug("Setting new Records...", data);
        this.rawData = data;
        this.invalidateCache();
    }

    addRecord(data) {
        console.debug("Adding new Record...", data);
        this.rawData.push(data);
        this.invalidateCache();
    }

    editRecord(data) {
        console.log("Edit Record..", data);
        this.rawData = this.rawData.filter(rec => rec[this.primaryKey] !== data[this.primaryKey]);
        this.rawData.push(data);
        this.invalidateCache();
    }

    deleteRecord(data) {
        console.log("Delete Record...", data);
        this.rawData = this.rawData.filter(rec => rec[this.primaryKey] !== data[this.primaryKey]);
        this.invalidateCache();
    }

    render() {
        const displayData = this.getPagedData();
        const selectedData = this.state.selectedData;
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
                    {this.createControlPanel()}
                    <div style={{
                        height: 'calc(100% - 30px)',
                        width: '100%',
                        overflow: 'auto'
                    }}>
                        <table className="table table-striped table-condensed table-hover table-bordered" style={{
                            marginBottom: '0'
                        }}>
                            {this.createTableHead()}
                            <tbody style={{
                            }}>
                            {displayData.map((data) => {
                                let pkValue = data[this.primaryKey];
                                return (
                                    <Row
                                        key={pkValue}
                                        primaryKey={this.primaryKey}
                                        columns={this.columns}
                                        isSelected={selectedData[pkValue]}
                                        onSelectOneRow={(select) => {
                                            this.onSelectOneRow(select, pkValue)
                                        }}
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
        let selected = (typeof props.isSelected == 'undefined') ? false : props.isSelected;
        this.state = {
            isSelected: selected
        };
    }

    handleRowClick(event) {
        let newValue = !this.state.isSelected;
        this.setState({isSelected: newValue});
        this.props.onSelectOneRow(newValue);
    }

    componentWillReceiveProps(props) {
        let oldState = (typeof this.state.isSelected == 'undefined') ? false : this.state.isSelected;
        let newState = (typeof props.isSelected == 'undefined') ? false : props.isSelected;
        if (oldState != newState) {
            this.setState({isSelected: newState});
        }
    }

    render() {
        const selected = this.props.isSelected;
        const selectionStyle = selected ? styles.rowSelected : {};
        return (
            <tr
                key={this.props.data[this.props.primaryKey]}
                onClick={this.handleRowClick.bind(this)}
            >
                <td style={{...styles.checkBox, ...selectionStyle}}>
                    <CheckBox selected={selected} onValueChanged={this.props.onSelectOneRow}/>
                </td>
                {this.props.columns.map((col) => {
                    return (
                        <td key={col.name} style={selectionStyle}>
                            {this.props.data[col.name]}
                        </td>
                    )
                })}
            </tr>
        );
    }
}

class CheckBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {value: this.props.selected}
    }

    componentWillReceiveProps(props) {
        let oldState = (typeof this.state.value == 'undefined') ? false : this.state.value;
        let newState = (typeof props.selected == 'undefined') ? false : props.selected;
        if (oldState != newState) {
            this.setState({value: newState});
        }
    }

    render() {
        //console.log('Render CheckBox', {s: this.state.value, p: this.props.selected});
        return (
            <input type="checkbox" checked={this.state.value} onChange={
                (event) => {
                    let newValue = !this.state.value;
                    this.setState({value: newValue});
                    this.props.onValueChanged(newValue);
                }}
            />
        )
    };
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


