import './App.css';
import { useEffect, useState, useRef, useMemo } from 'react';
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
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetch('/asr.tree')
      .then((response) => response.text())
      .then((data) => {
        setTree(data);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="App" style={{ display: 'flex', flexDirection: 'row' }}>
        <div ref={radialContainerRef} style={{ width: "33%", height: "500px", border: "1px solid black", overflow: "hidden" }}>
          <RadialTree data={tree} ref={radialRef} />
        </div>
        <div ref={rectContainerRef} style={{ width: "33%", height: "500px", border: "1px solid black", overflow: "hidden" }}>
          <RectTree data={tree} ref={rectRef} />
        </div>
        <div ref={unrootedContainerRef} style={{ width: "33%", height: "500px", border: "1px solid black", overflow: "hidden" }}>
          <UnrootedTree data={tree} ref={unrootedRef} />
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
          Search
        </button>
      </div>
    </div>
  );
}

export default App;
