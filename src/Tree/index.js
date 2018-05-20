import React from 'react';
import PropTypes from 'prop-types';
import { layout } from 'd3-3';
import clone from 'clone';
import uuid from 'uuid';

import NodeWrapper from './NodeWrapper';
import Node from '../Node';
import Link from '../Link';
import {hasChildrenWithAnotherParent} from '../Node';

import './style.css';

export default class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.assignInternalProperties(clone(props.data)),
      rd3tGClassName: `_${uuid.v4()}`,
    };
    this.internalState = {
      initialRender: true,
      isTransitioning: false,
      translate: this.props.translate,
    };
    this.findNodesById = this.findNodesById.bind(this);
    this.handleNodeToggle = this.handleNodeToggle.bind(this);
  }

  componentDidMount() {
    this.internalState.initialRender = false;
  }

  componentWillReceiveProps(nextProps) {
    // Clone new data & assign internal properties
    if (this.props.data !== nextProps.data) {
      this.setState({
        data: this.assignInternalProperties(clone(nextProps.data)),
      });
    }
  }

  /**
   * assignInternalProperties - Assigns internal properties to each node in the
   * `data` set that are required for tree manipulation and returns
   * a new `data` array.
   *
   * @param {array} data Hierarchical tree data
   *
   * @return {array} `data` array with internal properties added
   */
  assignInternalProperties(data) {
    return data.map(node => {
      node.id = uuid.v4();
      node._collapsed = false;
      // if there are children, recursively assign properties to them too
      if (node.children && node.children.length > 0) {
        node.children = this.assignInternalProperties(node.children);
        node._children = node.children;
      }
      return node;
    });
  }

  /**
   * findNodesById - Description
   *
   * @param {string} nodeId The `node.id` being searched for
   * @param {array} nodeSet Array of `node` objects
   * @param {array} hits Accumulator for matches, passed between recursive calls
   *
   * @return {array} Set of nodes matching `nodeId`
   */
  findNodesById(nodeId, nodeSet, hits) {
    if (hits.length > 0) {
      return hits;
    }
    hits = hits.concat(nodeSet.filter(node => node.id === nodeId));

    nodeSet.forEach(node => {
      if (node._children && node._children.length > 0) {
        hits = this.findNodesById(nodeId, node._children, hits);
        return hits;
      }
      return hits;
    });
    return hits;
  }

  /**
   * @param {object} node Node object with custom properties
   *
   * @return {void}
   */
  collapseNode(node) {
    node._collapsed = true;
  }

  /**
   * @param {type} node Node object with custom properties
   *
   * @return {void}
   */
  expandNode(node) {
    node._collapsed = false;
  }

  /**
   * handleNodeToggle - Finds the node matching `nodeId` and
   * expands/collapses it, depending on the current state of
   * its `_collapsed` property.
   *
   * @param {string} nodeId A node object's `id` field.
   *
   * @return {void}
   */
  handleNodeToggle(nodeId, evt) {
    const data = clone(this.state.data);
    const matches = this.findNodesById(nodeId, data, []);
    const targetNode = matches[0];

    if (!this.state.isTransitioning) {
      if (hasChildrenWithAnotherParent(targetNode)) {
        return;
      }
      targetNode._collapsed ? this.expandNode(targetNode) : this.collapseNode(targetNode);
      // Lock node toggling while transition takes place
      this.setState(
        { data, isTransitioning: true },
      );
      // Await transitionDuration + 10 ms before unlocking node toggling again
      setTimeout(
        () => this.setState({ isTransitioning: false }),
        this.props.transitionDuration + 10,
      );
    }
  }

  /**
   * generateTree - Generates tree elements (`nodes` and `links`) by
   * grabbing the rootNode from `this.state.data[0]`.
   *
   * @return {object} Object containing `nodes` and `links`.
   */
  generateTree() {
    const { nodeSize } = this.props;

    const tree = layout
      .tree()
      .nodeSize([nodeSize.y, nodeSize.x])
      .children(d => d._collapsed ? null : d._children);

    const rootNode = this.state.data[0];
    let nodes = tree.nodes(rootNode);

    if (this.internalState.initialRender) {
      nodes.forEach(n => {
        n._collapsed = n.depth >= 0;
        if (hasChildrenWithAnotherParent(n)) {
          n._collapsed = false;
        }
      });
      nodes = tree.nodes(rootNode);
    }

    const links = tree.links(nodes);

    nodes.forEach(n => {
      if (n.anotherParent) {
        //for multiple-parent nodes - shift their position
        //and add extra link to another parent
        n.x += nodeSize.y / 2;
        links.push(
          {
            source: nodes.filter( item => {
              return item.name === n.anotherParent;
            })[0],
            target: n
          }
        );
      }
    });

    return { nodes, links };
  }

  render() {
    const { nodes, links } = this.generateTree();
    const {
      transitionDuration,
      textLayout,
    } = this.props;
    const translate = this.internalState.translate;
    return (
      <div>
        <svg className="treeSvg">
          <NodeWrapper
            transitionDuration={transitionDuration}
            component="g"
            className={this.state.rd3tGClassName}
            transform={`translate(${translate.x},${translate.y})`}
          >
            {links.map(linkData => (
              <Link
                key={uuid.v4()}
                linkData={linkData}
                transitionDuration={transitionDuration}
              />
            ))}

            {nodes.map(nodeData => (
              <Node
                key={nodeData.id}
                transitionDuration={transitionDuration}
                nodeData={nodeData}
                name={nodeData.name}
                onClick={this.handleNodeToggle}
                textLayout={textLayout}
              />
            ))}
          </NodeWrapper>
        </svg>
      </div>
    );
  }
}

Tree.defaultProps = {
  translate: { x: 525, y: 200 },
  transitionDuration: 500,
  nodeSize: { x: 140, y: 90 },
  textLayout: {
    textAnchor: 'end',
    x: -20,
    y: 0,
    transform: undefined,
  },
};

Tree.propTypes = {
  data: PropTypes.array.isRequired,
  translate: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  transitionDuration: PropTypes.number,
  nodeSize: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  textLayout: PropTypes.object,
};
