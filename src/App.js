import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './App.css';
import { parseNewick, convertToD3Format } from './components/utils.ts';
import { RadialTree } from './components/tree3.tsx';

function App() {
  const [treeInputData, setTreeData] = useState(null);

  // Tree rendering constants
  const width = 1000;

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await fetch('/asr.tree');
        const newickString = await response.text();
        const parsedTree = parseNewick(newickString);
        const d3Tree = convertToD3Format(parsedTree);
        setTreeData(d3Tree);
      } catch (error) {
        console.error('Error loading tree:', error);
      }
    };
    fetchTree();
  }, []);

  useEffect(() => {
    

  }, [treeInputData]);

  return (
    <div className="App">
      <div style={{ width: '100vh', height: '100vh' }}>
        <RadialTree data={treeInputData} width={width} />
      </div>
    </div>
  );
}

export default App;