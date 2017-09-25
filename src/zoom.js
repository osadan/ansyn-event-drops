import * as d3 from 'd3/build/d3';
import xAxis from './xAxis';
import labels from './drawer/labels';
import { delimiters } from './drawer/delimiters';
import { boolOrReturnValue } from './drawer/xAxis';
import debounce from 'debounce';
import { event as currentEvent } from 'd3-selection';

export default (
    container,
    dimensions,
    scales,
    configuration,
    data,
    callback
) => {
    const onZoom = (data, index, element) => {
        const scalingFunction = d3.event.transform.rescaleX(scales.x);
        let result = {};
        if (boolOrReturnValue(configuration.hasTopAxis, data)) {
            container
                .selectAll('.x-axis.top')
                .call(d3.axisTop().scale(scalingFunction));
        }

        if (boolOrReturnValue(configuration.hasBottomAxis, data)) {
            container
                .selectAll('.x-axis.bottom')
                .call(d3.axisBottom().scale(scalingFunction));
        }

        const sumDataCount = debounce(
            (data, callback) => {
                const domain = scalingFunction.domain();

                const result = {
                    counts: labels(
                        container.select('.labels'),
                        { x: scalingFunction },
                        configuration
                    )(data),
                    dates: {
                        from: domain[0],
                        to: domain[1],
                    },
                };

                delimiters(
                    container,
                    { x: scalingFunction },
                    configuration.displayLabels
                        ? configuration.labelsWidth +
                              configuration.labelsRightMargin
                        : 0,
                    configuration.dateFormat
                );
                if (callback) {
                    callback(result);
                }
            },
            100
        );

        requestAnimationFrame(() => {
            container
                .selectAll('.drop-line')
                .selectAll('.drop')
                .attr('cx', (d, i) => {
                    return scalingFunction(new Date(d.date));
                });

            container
                .selectAll('.shape-line')
                .selectAll('.shape')
                .attr(
                    'transform',
                    d =>
                        `translate(${scalingFunction(configuration.date(d))},${configuration.shapes[d.shape].offsetY})`
                );

            sumDataCount(data, result => {
                if (callback) {
                    callback(result);
                }
            });
        });
    };

    const zoomEnd = (data, index, element) => {
        const scalingFunction = d3.event.transform.rescaleX(scales.x);
        const domain = scalingFunction.domain();
        configuration.zoomend({ dates: { from: domain[0], to: domain[1] } });
    };

    const zoom = d3
        .zoom()
        .scaleExtent([configuration.minScale, configuration.maxScale])
        .on('zoom', onZoom)
        .on('end', zoomEnd);

    container.call(zoom);
    return zoom;
};
