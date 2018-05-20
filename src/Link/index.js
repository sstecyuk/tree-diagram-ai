import React from 'react';
import PropTypes from 'prop-types';
import { svg, select } from 'd3-3';

import './style.css';

export default class Link extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      initialStyle: {
        opacity: 0,
      },
    };
  }

  componentDidMount() {
    this.applyOpacity(1, this.props.transitionDuration);
  }

  componentWillLeave(done) {
    this.applyOpacity(0, this.props.transitionDuration, done);
  }

  applyOpacity(opacity, transitionDuration, done = () => {}) {
    if (transitionDuration === 0) {
      select(this.link).style('opacity', opacity);
      done();
    } else {
      select(this.link)
        .transition()
        .duration(transitionDuration)
        .style('opacity', opacity)
        .each('end', done);
    }
  }

  drawDiagonal() {
    const diagonal = svg
      .diagonal()
      .projection(d => ([d.y, d.x]));
    return diagonal(this.props.linkData);
  }

  render() {
    return (
      <path
        ref={l => {
          this.link = l;
        }}
        style={{ ...this.state.initialStyle }}
        className="linkBase"
        d={this.drawDiagonal()}
      />
    );
  }
}

Link.propTypes = {
  linkData: PropTypes.object.isRequired,
  transitionDuration: PropTypes.number.isRequired,
};
