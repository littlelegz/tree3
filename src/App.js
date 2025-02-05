import { useEffect, useRef, useState } from 'react';
import './App.css';
import { readTree } from './components/utils.ts';
import { RadialTree } from './components/radial.tsx';
import { UnrootedTree } from './components/unrooted.tsx';
import { RectTree } from './components/rect.tsx';

function App() {
  const [treeInputData, setTreeData] = useState(null);
  const [unrootedTree, setUnrootedTree] = useState(null);
  const treeRef = useRef(null);
  const unrootedRef = useRef(null);

  // Tree rendering constants
  const width = 1500;

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await fetch(process.env.PUBLIC_URL + '/asr.tree');
        const newickString = await response.text();
        const parsedTree = readTree(newickString);
        setUnrootedTree(parsedTree);
        setTreeData(newickString);
      } catch (error) {
        console.error('Error loading tree:', error);
      }
    };
    fetchTree();

  }, []);

  const menuTest = [{
    label: function (node) {
      if (node['compare']) {
        return 'Uncompare';
      } else {  
        return 'Compare';
      }
    },
    onClick: function (node) {
      if (node['compare']) {
        console.log(node);
        node['compare'] = false;
      } else {
        console.log('not compare');
        node['compare'] = true;
      }
    },
    toShow: function (node) {
      return true;
    }
  }]

  return (
    <div className="App">
      <div style={{ width: '100vh', height: '100vh' }} >
        {/* <RadialTree data={treeInputData} width={width} ref={treeRef} customNodeMenuItems={menuTest}/> */}
        <RectTree data={treeInputData} width={width} ref={treeRef} customNodeMenuItems={menuTest}/>
        <button
          onClick={() => {
            treeRef.current?.setVariableLinks(true);
          }}
        style={{ position: 'absolute', top: '20px', left: '20px' }}
        >
        Variable
      </button>
    </div>
      <div style={{ width: '100vh', height: '100vh' }} >
        <UnrootedTree data={unrootedTree} width={width} height={width} ref={unrootedRef} />
      </div>
    </div >
  );
}

export default App;