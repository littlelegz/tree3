import './App.css';
import { useEffect, useState, useRef, useMemo, use } from 'react';
import { default as RadialTree } from './components/radial';
import { default as RectTree } from './components/rect';
import { default as UnrootedTree } from './components/unrooted';

function App() {
  // Read tree from public file
  const [tree, setTree] = useState(null);
  const radialRef = useRef(null);
  const rectRef = useRef(null);
  const unrootedRef = useRef(null);
  const radialContainerRef = useRef(null);
  const rectContainerRef = useRef(null);
  const unrootedContainerRef = useRef(null);
  const [searchValue, setSearchValue] = useState("Node10");
  const [variableLinks, setVariableLinks] = useState(false);
  const [displayLeaves, setDisplayLeaves] = useState(true);
  const [displayNodes, setDisplayNodes] = useState(true);
  const [tipAlign, setTipAlign] = useState(false);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/asr.tree`)
      .then((response) => response.text())
      .then((data) => {
        setTree(data);
      });
  }, []);

  useEffect(() => {
    if (rectRef?.current && radialRef?.current) {
      rectRef.current.setVariableLinks(variableLinks);
      radialRef.current.setVariableLinks(variableLinks);
    }
  }, [variableLinks]);

  useEffect(() => {
    if (rectRef?.current && radialRef?.current && unrootedRef?.current) {
      rectRef.current.setDisplayLeaves(displayLeaves);
      radialRef.current.setDisplayLeaves(displayLeaves);
      unrootedRef.current.setDisplayLeaves(displayLeaves);
    }
  }, [displayLeaves]);

  useEffect(() => {
    if (rectRef?.current && radialRef?.current && unrootedRef?.current) {
      rectRef.current.setDisplayNodes(displayNodes);
      radialRef.current.setDisplayNodes(displayNodes);
      unrootedRef.current.setDisplayNodes(displayNodes);
    }
  }, [displayNodes]);

  useEffect(() => {
    if (rectRef?.current && radialRef?.current) {
      rectRef.current.setTipAlign(tipAlign);
      radialRef.current.setTipAlign(tipAlign);
    }
  }, [tipAlign]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', margin: '10px' }}>
      <div className="App" style={{ display: 'flex', flexDirection: 'row' }}>
        <div ref={radialContainerRef} style={{ width: "33%", height: "500px", border: "1px solid black", overflow: "hidden" }}>
          <RadialTree
            data={tree}
            ref={radialRef}
            state={{ root: "Node15", colorDict: { "Node15": "#FF9999" } }}
            customTooltip={(node) => `${node.data.name}<br/>${node.data.name}`}
            onNodeClick={(ev, node) => console.log(node)}
          />
        </div>
        <div ref={rectContainerRef} style={{ width: "33%", height: "500px", border: "1px solid black", overflow: "hidden" }}>
          <RectTree
            data={tree}
            ref={rectRef}
            state={{ root: "Node74", colorDict: { "Node15": "#FF9999" } }}
            customTooltip={(node) => `${node.data.name}<br/>${node.data.name}`}
          />
        </div>
        <div ref={unrootedContainerRef} style={{ width: "33%", height: "500px", border: "1px solid black", overflow: "hidden" }}>
          <UnrootedTree
            data={tree}
            ref={unrootedRef}
            onNodeClick={(ev, node) => console.log(node)}
            homeNode={"bilR"}
            state={{ root: "Node74", colorDict: { "Node15": "#FF9999" } }}
            customTooltip={(node) => `${node.data.name}<br/>${node.data.name}`}
          />
        </div>
      </div>
      <div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Enter node name"
        />
        <button onClick={() => {
          if (searchValue && rectRef.current) {
            rectRef.current.findAndZoom(searchValue, rectContainerRef);
            radialRef.current.findAndZoom(searchValue, radialContainerRef);
            unrootedRef.current.findAndZoom(searchValue, unrootedContainerRef);
          }
        }}>
          Find
        </button>
        <button onClick={() => { rectRef.current.refresh(); radialRef.current.refresh(); unrootedRef.current.refresh(); }}>
          Reset
        </button>
        <button onClick={() => { setVariableLinks(!variableLinks); }}>
          Toggle Variable Links
        </button>
        <button onClick={() => { setDisplayLeaves(!displayLeaves); }}>
          Toggle Leaf Labels
        </button>
        <button onClick={() => { setTipAlign(!tipAlign); }}>
          Toggle Leaf Alignment
        </button>
        <button onClick={() => { radialRef.current.findAndReroot("Node11") }}>
          findAndReroot
        </button>
        <button onClick={() => { console.log(unrootedRef.current.getState()) }}>
          print state
        </button>
        <button onClick={() => { rectRef.current.resetRoot(); radialRef.current.resetRoot(); unrootedRef.current.resetRoot(); }}>
          Reset Root
        </button>
        <button onClick={() => { rectRef.current.clearHighlights(); radialRef.current.clearHighlights(); unrootedRef.current.clearHighlights(); }}>
          Clear Highlights
        </button>
        <button onClick={() => { setDisplayNodes(!displayNodes) }}>
          Toggle Nodes
        </button>
      </div>
    </div>
  );
}

export default App;
