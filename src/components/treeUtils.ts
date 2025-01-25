import { RadialNode, RadialNodeLink } from './types';
import * as d3 from 'd3';

let linkExtensionRef: d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown> | null = null;
let linkRef: d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown> | null = null;
let nodesRef: d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown> | null = null;

export const setRefs = (
  linkExtension: d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>,
  link: d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>,
  nodes: d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown>
) => {
  linkExtensionRef = linkExtension;
  linkRef = link;
  nodesRef = nodes;
};

export const getLinkExtension = () => linkExtensionRef;
export const getLink = () => linkRef;
export const getNodes = () => nodesRef;