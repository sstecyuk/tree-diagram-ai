import React from 'react';
import PropTypes from 'prop-types';
import { select } from 'd3-3';

import './style.css';

export const hasChildrenWithAnotherParent = (node) => {
  if (node.children && node.children.length > 0) {
    return node.children.some ( child => {
       return child.anotherParent !== undefined
    });
  }
  return false;
}

export default class Node extends React.Component {
  constructor(props) {
    super(props);
    const { nodeData: { parent } } = props;
    const originX = parent ? parent.x : 0;
    const originY = parent ? parent.y : 0;

    this.state = {
      transform: this.setTransform(originX, originY),
      initialStyle: {
        opacity: 0
      },
      collapsed: this.props.nodeData._collapsed,
    };

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    const { nodeData: { x, y }, transitionDuration } = this.props;
    const transform = this.setTransform(x, y);
    this.applyTransform(transform, transitionDuration);
  }

  componentWillUpdate(nextProps) {
    const transform = this.setTransform(
      nextProps.nodeData.x,
      nextProps.nodeData.y,
    );
    this.applyTransform(transform, nextProps.transitionDuration);
  }

  shouldComponentUpdate(nextProps) {
    return this.shouldNodeTransform(this.props, nextProps);
  }

  shouldNodeTransform(ownProps, nextProps) {
    return (
      nextProps.nodeData.x !== ownProps.nodeData.x ||
      nextProps.nodeData.y !== ownProps.nodeData.y ||
      nextProps.nodeData._collapsed !==ownProps.nodeData._collapsed
    );
  }

  setTransform(x, y) {
    return `translate(${y},${x})`;
  }

  applyTransform(transform, transitionDuration, opacity = 1, done = () => {}) {
    if (transitionDuration === 0) {
      select(this.node)
        .attr('transform', transform)
        .style('opacity', opacity);
      done();
    } else {
      select(this.node)
        .transition()
        .duration(transitionDuration)
        .attr('transform', transform)
        .style('opacity', opacity)
        .each('end', done);
    }
  }

  handleClick(evt) {
    this.setState( {collapsed: !this.state.collapsed} );
    this.props.onClick(this.props.nodeData.id, evt);
  }

  componentWillLeave(done) {
    const { nodeData: { parent }, transitionDuration } = this.props;
    const originX = parent ? parent.x : 0;
    const originY = parent ? parent.y : 0;
    const transform = this.setTransform(originX, originY);
    this.applyTransform(transform, transitionDuration, 0, done);
  }

  render() {
    const {nodeData, textLayout, name, circleRadius } = this.props;
    return (
      <g
        id={nodeData.id}
        ref={n => {
          this.node = n;
        }}
        className = {nodeData._children
                            && !hasChildrenWithAnotherParent(nodeData)
                            && this.state.collapsed
                            ? 'nodeBase' : 'leafNodeBase'}
        style={this.state.initialStyle}
        transform={this.state.transform}
        onClick={this.handleClick}
      >
        <circle r={circleRadius} />
        <g>
          <text
            className="nodeNameBase"
            textAnchor={textLayout.textAnchor}
            x={textLayout.x}
            y={textLayout.y}
            transform={textLayout.transform}
            dy=".35em"
          >
            {name}
          </text>
        </g>
      </g>
    );
  }
}

Node.defaultProps = {
  circleRadius: 10,
};

Node.propTypes = {
  nodeData: PropTypes.object.isRequired,
  transitionDuration: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  textLayout: PropTypes.object.isRequired
};
