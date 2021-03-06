import React from 'react';
import {findDOMNode} from "react-dom";
import Pagination from "react-js-pagination";

const getScrollBarWidth = function () {
    // Create the measurement node
    let scrollDiv = document.createElement("div");
    scrollDiv.style.width = '100px';
    scrollDiv.style.height = '100px';
    scrollDiv.style.overflow = 'scroll';
    scrollDiv.style.position = 'absolute';
    scrollDiv.style.top = '-9999px';
    document.body.appendChild(scrollDiv);
    // Get the scrollbar width
    let scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    // Delete the DIV
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
};
const scrollBarW = getScrollBarWidth();
const styles = {
    checkBox: {
        width: '40px'
    },
    rowSelected: {
        backgroundColor: '#ddd1e7'
    },
    thead_tbody_tr: {
        display: 'table',
        width: '100%',
        tableLayout: 'fixed'
    },
    thead: {
        width: 'calc( 100% - ' + scrollBarW + 'px )',
        overflow: 'scroll',
        border: 'none'
    },
    tbody: {
        display: 'block',
        height: 'calc( 100% - 50px )',
        overflowY: 'scroll'
    },
    thead_tr: {},
    td: {
        borderTop: 'none'
    },
    thead_td: {
        borderRight: 'none'
    }
};

const createPagnationClass = function () {
    let styleName = 'customPagenationStyle';
    let styleElement = document.getElementById(styleName);
    if (styleElement)
        document.getElementsByTagName('head')[0].removeChild(styleElement);
    styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.id = styleName;
    styleElement.innerHTML = `
        .customPagenationStyle{
            float: right;
            margin: 0;
        }
    `;
    document.getElementsByTagName('head')[0].appendChild(styleElement);

};

export default class ListGrid extends React.Component {
    constructor(props) {
        super(props);
        this.tableConfig = this.props.config;
        this.rawData = this.props.data;
        this.primaryKey = this.tableConfig.primaryKey;
        this.columns = this.tableConfig.columns.filter((col) => {
            return col.showOnGrid
        });
        createPagnationClass();
        //Local to List grid
        /**
         * Store Ids of the selected Data
         * @type {{}}
         */
        this.criteria = {};
        this.isPaged = this.props.isPaged || false;
        this.footerHeight = this.isPaged ? 40 : 0;
        this.state = {
            itemsCountPerPage: 10,
            allRowsSelected: false,
            displayData: [...this.rawData],
            selectedData: {},
            sortDir: "ASC",//ASC/DESC
            sortBy: this.primaryKey,
            currentPage: 1,
            showFilter: true,
            tableHeight: 200
        };
        //Refs
        this.myTable = undefined;
        this.tableHead = undefined;
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
        console.debug("Sorting...", sortBy + " " + sortDir);
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
        console.debug("Filtering..", criteria);
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
            <thead style={{...styles.thead_tbody_tr, ...styles.thead}} ref={(dv) => {
                this.tableHead = dv;
            }}>
            <tr style={{
                ...styles.thead_tbody_tr, ...styles.thead_tr,
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
                        <th key={col.name} style={styles.thead_td}>
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
        console.debug("Edit Record..", data);
        this.rawData = this.rawData.filter(rec => rec[this.primaryKey] !== data[this.primaryKey]);
        this.rawData.push(data);
        this.invalidateCache();
    }

    deleteRecord(data) {
        console.debug("Delete Record...", data);
        this.rawData = this.rawData.filter(rec => rec[this.primaryKey] !== data[this.primaryKey]);
        this.invalidateCache();
    }


    updateDimensions() {
        let node = findDOMNode(this.myTable);
        let head = findDOMNode(this.tableHead);
        if (node && head) {
            let tableHeight = node.clientHeight;
            let headHeight = head.clientHeight;
            this.setState({tableHeight: (tableHeight - headHeight)});
        } else {
            alert("didntFindNode.....")
        }

    }

    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions.bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions.bind(this));
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
                    height: 'calc(100% - ' + this.footerHeight + 'px)',
                    width: '100%',
                    padding: '5px'
                }}>
                    {this.createControlPanel()}
                    <div style={{
                        height: 'calc(100% - 30px)',
                        width: '100%',
                    }} ref={(dv) => {
                        this.myTable = dv;
                    }}>
                        <table className="table table-striped table-condensed table-hover table-bordered"
                               style={{
                                   marginBottom: '0',
                                   height: '100%'
                               }}
                        >
                            {this.createTableHead()}
                            <tbody style={{...styles.thead_tbody_tr, ...styles.tbody, height: this.state.tableHeight}}>
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
                {   this.isPaged &&
                <div className="panel-footer " style={{
                    margin: 0,
                    height: this.footerHeight + 'px',
                    padding: "5px",
                }}>
                    <Pager
                        itemsCountPerPage={this.state.itemsCountPerPage}
                        totalItemsCount={this.state.displayData.length}
                        pageRangeDisplayed={5}
                        changeHandler={this.onPagerChanged.bind(this)}
                    />
                </div>
                }

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
            <tr style={{...styles.thead_tbody_tr}}
                key={this.props.data[this.props.primaryKey]}
                onClick={this.handleRowClick.bind(this)}
            >
                <td style={{...styles.checkBox, ...selectionStyle, ...styles.td}}>
                    <CheckBox selected={selected} onValueChanged={this.props.onSelectOneRow}/>
                </td>
                {this.props.columns.map((col) => {
                    return (
                        <td key={col.name} style={{...selectionStyle, ...styles.td}}>
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
        //console.debug('Render CheckBox', {s: this.state.value, p: this.props.selected});
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
        console.debug(`active page is ${pageNumber}`);
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
                innerClass="pagination customPagenationStyle"
            />
        );
    }
}


