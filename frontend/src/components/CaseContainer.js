import React, { Component } from 'react';
import { useParams } from "react-router-dom";
import { Grid, Box, DropButton, Menu, TextInput, Layer, Button } from 'grommet';
import { grommet } from 'grommet/themes';
import { FormSearch, AddCircle, Trash, StatusGood, FormClose } from 'grommet-icons';
import { deepMerge } from 'grommet/utils';


import RoundLayer from './Layer.js';
import MermaidChart from './Mermaid';
import configData from "../config.json";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import CaseSelector from './CaseSelector.js'
import ItemViewer from './ItemViewer.js';
import ItemEditor from './ItemEditor.js';
import ItemCreator from './ItemCreator.js'

class CaseContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showViewLayer: false,
      showEditLayer: false,
      showCreateLayer: false,
      loading: true,
      assurance_case: {
        id: 0,
        name: "",
        description: "",
        goals: []
      },
      mermaid_md: "graph TB; \n"
    }

    this.url = `${configData.BASE_URL}/cases/`;
  };

  fetchData = async (id) => {
    const res = await fetch(this.url + id);
    const json_response = await res.json()

    this.setState({
      assurance_case: json_response
    });
    this.setState({
      mermaid_md: this.jsonToMermaid(this.state.assurance_case)
    })
    this.setState({ loading: false })
  }

  componentDidMount() {
    const id = this.props.params.caseSlug;
    this.setState({id:id})
    this.fetchData(id);
  }

  componentDidUpdate(prevProps) {
    const id = this.props.params.caseSlug;
    const oldId = prevProps.params.caseSlug;
    if (id != oldId) {
      this.setState({id:id}, this.updateView)
    }
  }

  jsonToMermaid(in_json) {
    // function to convert the JSON response from a GET request to the /cases/id
    // API endpoint, into the markdown string required for Mermaid to render a flowchart.

    // Nodes in the flowchart will be named [TypeName]_[ID]
    function getNodeName(itemType,itemId) {
      return itemType+"_"+itemId;
    }

    function makeBox(text, shape) {
      if (shape === "square") return "[" + text + "]";
      else if (shape === "diamond") return "{" + text + "}";
      else if (shape === "rounded") return "(" + text + ")";
      else if (shape === "circle") return "((" + text + "))";
      else if (shape === "data") return "[(" + text + ")]";
      else return "";
    }

    let arrow = " --- "
    /// Recursive function to go down the tree adding components
    function addTree(itemType, parent, parentNode, outputmd) {
      // look up the 'API name', e.g. "goals" for "TopLevelNormativeGoal"
      let thisType = configData.navigation[itemType]["db_name"]
      let boxShape = configData.navigation[itemType]["shape"]
      // loop over all objects of this type
      for (let i = 0; i < parent[thisType].length; i++) {
        let thisObj = parent[thisType][i]
        let thisNode = getNodeName(itemType, thisObj.id);
        if (parentNode != null) {
          outputmd += parentNode + arrow + thisNode + makeBox(thisObj.name, boxShape) + "\n"
        } else {
          outputmd += thisNode + makeBox(thisObj.name, boxShape) + "\n";
        }
        // add a click link to the node
        outputmd += "\n click " + thisNode + " callback" + "\n";
        for (let j=0; j < configData.navigation[itemType]["children"].length; j++) {
          let childType = configData.navigation[itemType]["children"][j]
          outputmd = addTree(childType, thisObj, thisNode, outputmd)
        }
      }
     // console.log(outputmd)
      return outputmd;
    }

    let outputmd = "graph TB; \n"
    // call the recursive addTree function, starting with the Goal as the top node
    outputmd = addTree("TopLevelNormativeGoal", in_json, null, outputmd)
  
    return (outputmd)
  }

  updateView() {
    // render() will be called again anytime setState is called, which
    // is done both by hideEditLayer() and hideCreateLayer()
    this.setState({loading: true});
    this.hideViewLayer()
    this.hideEditLayer()
    this.hideCreateLayer() 
    this.fetchData(this.state.id);
    console.log("in updateView")
  }

  showViewLayer(e) {
    // use the name of the node to derive the type and id of the item that 
    // was clicked on, and set the state accordingly.  
    // This will cause a new layer, showing the details of the selected node,
    // to appear (the ItemViewer component)
    let chunks = e.split("_");
    if (chunks.length === 2) {
      let itemType = chunks[0];
      let itemId = chunks[1];
      
      this.setState({itemType: itemType, itemId: itemId})
    }
    // Maybe this is unnecessary, to check that the itemType and itemId state is
    // set, but need to make sure showViewLayer isn't set prematurely.
    if (this.state.itemType && this.state.itemId) this.setState({ showViewLayer: true })
  }

  showEditLayer(itemType, itemId, event) {
    console.log("in showEditLayer", this, itemId)
    event.preventDefault()
    // this should be redundant, as the itemId and itemType should already 
    // be set when showViewLayer is called, but they can't do any harm..
    this.setState(
      {itemType: itemType, 
      itemId: itemId}
    )
    this.hideViewLayer()
    this.setState({ showEditLayer: true})
  }

  showCreateLayer(itemType, parentId, event) {
    console.log("in showCreateLayer", this, parentId)
    event.preventDefault()
    this.setState(
      {createItemType: itemType, 
      createItemParentId: parentId}
    )
    this.setState({ showCreateLayer: true})
  }

  hideViewLayer() {
    this.setState(
      {showViewLayer: false}
    )
  }

  hideEditLayer() {
    this.setState(
      {showEditLayer: false,
        itemType: null,
        itemId: null
      })
  }

  hideCreateLayer() {
    this.setState(
      {showCreateLayer: false,
        createItemType: null,
        createItemParentId: null
      })
  }

  viewLayer() {
    return (
      <Box >
          <Layer
            full="vertical"
            position="right"
            onEsc={() => this.hideViewLayer()}
            onClickOutside={() => this.hideViewLayer()}
          >
            <Box
              pad="medium"
              gap="small"
              width={{ min: 'medium' }}
              height={{ min: 'small' }}
              fill
            >
              <Button alignSelf="end" icon={<FormClose />} onClick={() => this.hideViewLayer()} />
              <Box >
                <ItemViewer
                type={this.state.itemType} 
                id={this.state.itemId} 
                editItemLayer={this.showEditLayer.bind(this)}
                updateView={this.updateView.bind(this)}
                />
              </Box>
            </Box>
          </Layer>
      </Box>
    );
  }

  editLayer() {
    return (
      <Box >
          <Layer
            full="vertical"//"false"
            position="right"//"bottom-left"
            onEsc={() => this.hideEditLayer()}
            onClickOutside={() => this.hideEditLayer()}
          >
            <Box
              pad="medium"
              gap="small"
              width={{ min: 'medium' }}
              height={{ min: 'small' }}
              fill
            >
              <Button alignSelf="end" icon={<FormClose />} onClick={() => this.hideEditLayer()} />
              <Box >
                <ItemEditor 
                  type={this.state.itemType} 
                  id={this.state.itemId} 
                  createItemLayer={this.showCreateLayer.bind(this)}
                  updateView={this.updateView.bind(this)}
                />
              </Box>
            </Box>
          </Layer>
      </Box>
    );
  }

  createLayer() {
    return (
      <Box >
          <Layer
            full="false"
            position="bottom-right"//"bottom-left"
            onEsc={() => this.hideCreateLayer()}
            onClickOutside={() => this.hideCreateLayer()}
          >
            <Box
              pad="medium"
              gap="small"
              width={{ min: 'medium' }}
              height={{ min: 'small' }}
              fill
            >
              <Button alignSelf="end" icon={<FormClose />} onClick={() => this.hideCreateLayer()} />
              <Box >
                <ItemCreator 
                type={this.state.createItemType} 
                parentId={this.state.createItemParentId} 
                updateView={this.updateView.bind(this)}
                />
              </Box>
            </Box>
          </Layer>
      </Box>
    );
  }


  render() {
    // don't try to render the chart until we're sure we have the full JSON from the DB
    if (this.state.loading) {
      return (
        <div>loading</div>
      )
    } else {
      return (
        <div>
          <Grid
            rows={['3px', 'flex', 'xxsmall']} //{['xxsmall', 'flex', 'xxsmall']}
            columns={['flex', "20%"]}
            gap="medium"
            areas={[
              { name: 'header', start: [0, 0], end: [0, 0] },
              { name: 'main', start: [0, 1], end: [0, 1] },
              { name: 'right', start: [1, 1], end: [1, 1] },
              { name: 'footer', start: [0, 2], end: [1, 2] },
            ]}
          >
          { this.state.showViewLayer && this.state.itemType && this.state.itemId && this.viewLayer()}
          { this.state.showEditLayer && this.state.itemType && this.state.itemId && this.editLayer()}
          { this.state.showCreateLayer && this.state.createItemType && this.state.createItemParentId && this.createLayer()}
            <Box gridArea="main" background={{ color: "white", size: "20px 20px", image: "radial-gradient(#999999 0.2%, transparent 10%)", height: "200px", width: "100%", repeat: "repeat-xy" }}>
              {/* {this.Example()} */}
              <Box width={"flex"} height={'30px'} >  <h2> &nbsp;{this.state.assurance_case.name}</h2>  </Box>
              <TransformWrapper
                initialScale={1}
                initialPositionX={25}
                initialPositionY={40}
              >
                {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                  <React.Fragment>
                    <TransformComponent >
                      <MermaidChart
                        chartmd={this.state.mermaid_md}
                        viewLayerFunc={(e) => this.showViewLayer(e)}
                      />
                    </TransformComponent>
                    <div className="tools">
                      <button onClick={() => zoomIn()}>+</button>
                      <button onClick={() => zoomOut()}>-</button>
                      <button onClick={() => resetTransform()}>x</button>
                    </div>
                  </React.Fragment>
                )}
              </TransformWrapper>
            </Box>
            {/* {{ color: "#ff0000" }} */}

            <Box direction="column" gap={'4px'} gridArea="right" background="light-2">
              < CaseSelector />
              <Box direction="row" width={"flex"} height={'50px'} background="light-2" >
                <Box width={"15%"} height={"flex"} background="light-2"><FormSearch color='plain' size='large' /></Box>
                <Box width={"80%"} height={"flex"} background="light-2"><TextInput
                  placeholder="Search" /></Box>
              </Box>
              

              
              <DropButton
                label="Add TopLevelNormativeGoal"
                dropAlign={{ top: 'bottom', right: 'right' }}
                dropContent={
                  <ItemCreator 
                  type="TopLevelNormativeGoal" 
                  parentId={this.state.id} 
                  updateView={this.updateView.bind(this)}
                  />
                }
              />
            </Box>
            <Box gridArea="footer" background="light-5"> &copy; credits </Box>

          </Grid >

        </div >
      )
    }
  }
}

export default (props) => (
  <CaseContainer
    {...props}
    params={useParams()}
  />
);
