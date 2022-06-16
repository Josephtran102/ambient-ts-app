import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { DetailedHTMLProps, HTMLAttributes, useEffect, useRef, useState } from 'react';
import './Chart.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'd3fc-group': DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
            'd3fc-svg': DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        }
    }
}

export default function Chart() {
    const d3Container = useRef(null);
    const d3PlotArea = useRef(null);
    const d3Xaxis = useRef(null);
    const d3Yaxis = useRef(null);

    const [data] = useState(d3fc.randomFinancial()(50));
    const [targets, setTargets] = useState([
        {
            name: 'high',
            value: 98.42,
        },
        {
            name: 'low',
            value: 97.2,
        },
    ]);
    const [liquidityData, setLiquidityData] = useState([
        {
            tick: 98,
            value: 45006,
        },
        {
            tick: 98.5,
            value: 128736,
        },
        {
            tick: 99,
            value: 678736,
        },
        {
            tick: 99.5,
            value: 736123,
        },
        {
            tick: 100,
            value: 999204,
        },
    ]);
    // console.log('Helooo');

    useEffect(() => {
        console.log('update chart');

        const priceRange = d3fc.extentLinear().accessors([(d: any) => d.high, (d: any) => d.low]);
        const xExtent = d3fc.extentDate().accessors([(d: any) => d.date]);

        const xScale = d3.scaleTime();
        const yScale = d3.scaleLinear();
        const liquidityTickScale = d3.scaleLinear();
        const liquidityScale = d3.scaleLinear();

        // bar chart
        const priceScale = d3.scaleLinear().domain(priceRange);
        const liquidityExtent = d3fc
            .extentLinear(liquidityData)
            .include([0])
            .accessors([(d: any) => d.value]);

        xScale.domain(xExtent(data));
        yScale.domain(priceRange(data));
        liquidityScale.domain(liquidityExtent(liquidityData));

        // axes
        const xAxis = d3fc.axisBottom().scale(xScale);
        const yAxis = d3fc.axisRight().scale(yScale);

        const gridlines = d3fc.annotationSvgGridline().xScale(xScale).yScale(yScale);
        const candlestick = d3fc
            .seriesSvgCandlestick()
            .decorate((selection: any) => {
                selection
                    .enter()
                    .style('fill', (d: any) => (d.close > d.open ? '#7371FC' : '#CDC1FF'))
                    .style('stroke', (d: any) => (d.close > d.open ? '#7371FC' : '#CDC1FF'));
            })
            .xScale(xScale)
            .yScale(yScale);

        const barSeries = d3fc
            .autoBandwidth(d3fc.seriesSvgBar())
            .orient('horizontal')
            .mainValue((d: any) => d.value)
            .crossValue((d: any) => d.tick)
            .xScale(liquidityScale)
            .yScale(yScale);

        const horizontalLine = d3fc
            .annotationSvgLine()
            .value((d: any) => d.value)
            .xScale(xScale)
            .yScale(yScale);

        const valueFormatter = d3.format('.2f');

        const drag = d3.drag().on('drag', function (event, d: any) {
            const plotY = d3.pointer(event, d3.select('.plot-chart').select('svg'))[1];
            console.log('y: ', plotY, ' invert: ', yScale.invert(d3.pointer(event)[1] - 90));

            const newValue = yScale.invert(d3.pointer(event)[1] - 90);
            setTargets((prevState) => {
                const newTargets = [...prevState];
                newTargets.filter((target: any) => target.name === d.name)[0].value = newValue;
                return newTargets;
            });
        });

        horizontalLine.decorate((selection: any) => {
            selection.enter().select('g.left-handle').append('text').attr('x', 5).attr('y', -5);
            selection.enter().select('line').attr('class', 'redline').attr('stroke', 'red');
            selection
                .select('g.left-handle text')
                .text((d: any) => d.name + ' - ' + valueFormatter(d.value));
            selection
                .enter()
                .append('line')
                .attr('class', 'detector')
                .attr('stroke', 'transparent')
                .attr('x2', '100%')
                .attr('stroke-width', 5)
                .style('pointer-events', 'all')
                .on('mouseover', (event: any) => {
                    d3.select(event.currentTarget).style('cursor', 'ns-resize');
                })
                .on('mouseout', (event: any) => {
                    d3.select(event.currentTarget).style('cursor', 'default');
                })
                .call(drag);
        });

        const gridJoin = d3fc.dataJoin('g', 'grid');
        const candleJoin = d3fc.dataJoin('g', 'candle');
        const targetsJoin = d3fc.dataJoin('g', 'targets');
        const barJoin = d3fc.dataJoin('g', 'bar');

        // handle the plot area measure event in order to compute the scale ranges
        d3.select(d3PlotArea.current).on('measure', function (event: any) {
            xScale.range([0, event.detail.width]);
            yScale.range([event.detail.height, 0]);
            liquidityTickScale.range([event.detail.height, 0]);
            liquidityScale.range([event.detail.width, event.detail.width / 2]);
        });

        d3.select(d3PlotArea.current).on('draw', function (event: any) {
            const svg = d3.select(event.target).select('svg');

            gridJoin(svg, [data]).call(gridlines);
            candleJoin(svg, [data]).call(candlestick);
            barJoin(svg, [liquidityData]).call(barSeries);
            targetsJoin(svg, [targets]).call(horizontalLine);
        });

        d3.select(d3Xaxis.current).on('draw', function (event: any) {
            d3.select(event.target).select('svg').call(xAxis);
        });

        d3.select(d3Yaxis.current).on('draw', function (event: any) {
            d3.select(event.target).select('svg').call(yAxis);
        });
        const nd = d3.select('#group').node() as any;
        nd.requestRedraw();
    }, [targets, data]);

    return (
        <div ref={d3Container} className='main_layout' data-testid={'chart'}>
            <d3fc-group
                id='group'
                className='hellooo'
                style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column' }}
                auto-resize
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                        <d3fc-svg
                            ref={d3PlotArea}
                            className='plot-area'
                            style={{ flex: 1, overflow: 'hidden' }}
                        ></d3fc-svg>
                        <d3fc-svg ref={d3Yaxis} style={{ width: '3em' }}></d3fc-svg>
                    </div>
                    <d3fc-svg
                        ref={d3Xaxis}
                        className='x-axis'
                        style={{ height: '2em', marginRight: '3em' }}
                    ></d3fc-svg>
                </div>
            </d3fc-group>
        </div>
    );
}
