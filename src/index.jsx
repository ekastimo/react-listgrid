import React from "react";
import {render} from "react-dom";
import "bootstrap/dist/css/bootstrap.css";
import "./css/listgrid.css";
import ListGrid from "./widgets/ListGrid.jsx"
import DATA from "./utils/DataCache.jsx"
class Index extends React.Component {
    render() {
        return (
            <div style={{
                width: "100%",
                height: "100%",
                padding: 5,
            }}>
                <ListGrid
                    config={DATA.tableConfig}
                    data={DATA.tableData}
                />
            </div>
        )
    }
}
render(<Index/>, document.getElementById('content'));