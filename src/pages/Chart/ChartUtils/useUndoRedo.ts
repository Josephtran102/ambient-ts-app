import {
    LS_KEY_CHART_ANNOTATIONS,
    drawDataHistory,
    drawnShapeEditAttributes,
} from './chartUtils';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CrocEnvContext } from '../../../contexts/CrocEnvContext';
import { TradeDataContext } from '../../../contexts/TradeDataContext';
import { fibDefaultLevels } from './drawConstants';

export interface actionKeyIF {
    poolIndex: number;
    tokenA: string;
    tokenB: string;
}

export function useUndoRedo(denomInBase: boolean, isTokenABase: boolean) {
    const initialData = localStorage.getItem(LS_KEY_CHART_ANNOTATIONS);
    const initialArray = initialData
        ? JSON.parse(initialData)?.drawnShapes || []
        : [];

    const [drawnShapeHistory, setDrawnShapeHistory] = useState<
        drawDataHistory[]
    >([]);

    const {
        chainData: { poolIndex },
    } = useContext(CrocEnvContext);

    const [drawActionStack, setDrawActionStack] = useState(
        new Map<actionKeyIF, drawDataHistory[]>(),
    );

    const [undoStack] = useState(new Map<actionKeyIF, drawDataHistory[]>());
    const [isLocalStorageFetched, setIsLocalStorageFetched] = useState(false);

    const currentPool = useContext(TradeDataContext);

    const { tokenA, tokenB } = currentPool;

    useEffect(() => {
        if (
            drawnShapeHistory.length === 0 &&
            initialArray.length > 0 &&
            !isLocalStorageFetched
        ) {
            const refactoredArray: Array<drawDataHistory> = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialArray.forEach((element: any) => {
                if (
                    Object.prototype.hasOwnProperty.call(element, 'lineWidth')
                ) {
                    const newElement: drawDataHistory = {
                        data: element.data,
                        type: element.type,
                        time: element.time,
                        pool: element.pool,
                        extendLeft: false,
                        extendRight: false,
                        labelPlacement: 'left',
                        labelAlignment: 'center',
                        reverse: false,
                        extraData: ['FibRetracement'].includes(element.type)
                            ? structuredClone(fibDefaultLevels)
                            : [],
                        line: {
                            active: !['Rect'].includes(element.type),
                            color: 'rgba(115, 113, 252, 1)',
                            lineWidth: 1.5,
                            dash:
                                element.type === 'FibRetracement'
                                    ? [6, 6]
                                    : [0, 0],
                        } as drawnShapeEditAttributes,

                        border: {
                            active: ['Rect'].includes(element.type),
                            color: 'rgba(115, 113, 252, 1)',
                            lineWidth: 0,
                            dash: [0, 0],
                        } as drawnShapeEditAttributes,

                        background: {
                            active: ['Rect', 'DPRange'].includes(element.type),
                            color: 'rgba(115, 113, 252, 0.15)',
                            lineWidth: 1.5,
                            dash: [0, 0],
                        } as drawnShapeEditAttributes,
                    };

                    refactoredArray.push(newElement);
                }
            });

            setDrawnShapeHistory(() =>
                refactoredArray.length > 0 ? refactoredArray : initialArray,
            );
        }

        setIsLocalStorageFetched(() => {
            return true;
        });
    }, [initialData, isLocalStorageFetched]);

    const actionKey = useMemo(() => {
        const newActionKey = {
            poolIndex: poolIndex,
            tokenA: tokenA.address,
            tokenB: tokenB.address,
        };
        let existingKey = null;

        for (const k of drawActionStack.keys()) {
            if (JSON.stringify(k) === JSON.stringify(newActionKey)) {
                existingKey = k;
                break;
            }
        }

        if (existingKey) {
            return existingKey;
        }

        return newActionKey;
    }, [poolIndex, tokenA, tokenB]);

    const deleteAllShapes = useCallback(() => {
        const deletedItems: drawDataHistory[] = [];

        const actionList = drawActionStack.get(actionKey);

        const filteredDrawnShapeHistory = drawnShapeHistory.filter(
            (element) => {
                const isShapeInCurrentPool =
                    currentPool.tokenA.address ===
                        (isTokenABase === element.pool.isTokenABase
                            ? element.pool.tokenA
                            : element.pool.tokenB) &&
                    currentPool.tokenB.address ===
                        (isTokenABase === element.pool.isTokenABase
                            ? element.pool.tokenB
                            : element.pool.tokenA);

                if (isShapeInCurrentPool) {
                    deletedItems.push(element);
                }
                return !isShapeInCurrentPool;
            },
        );

        if (actionList) {
            deletedItems.forEach((item) => {
                const findItem = actionList.find((i) => {
                    return (
                        JSON.stringify(i.data) === JSON.stringify(item.data) &&
                        i.time === item.time
                    );
                });

                if (findItem) {
                    const tempHistoryData = {
                        data: [
                            {
                                x: -1,
                                y: -1,
                                denomInBase: denomInBase,
                            },
                            {
                                x: -1,
                                y: -1,
                                denomInBase: denomInBase,
                            },
                        ],
                        type: findItem.type,
                        time: findItem.time,
                        pool: findItem.pool,
                        border: findItem.border,
                        line: findItem.line,
                        background: findItem.background,
                        extraData: findItem.extraData,
                        extendLeft: findItem.extendLeft,
                        extendRight: findItem.extendRight,
                        labelPlacement: findItem.labelPlacement,
                        labelAlignment: findItem.labelAlignment,
                        reverse: findItem.reverse,
                    };

                    drawActionStack.get(actionKey)?.push(tempHistoryData);
                }
            });
        }

        setDrawnShapeHistory(filteredDrawnShapeHistory);
    }, [actionKey, drawnShapeHistory]);

    useEffect(() => {
        initialArray.forEach((element: drawDataHistory) => {
            const tempData = {
                data: [
                    {
                        x: element.data[0].x,
                        y: element.data[0].y,
                        denomInBase: denomInBase,
                    },
                    {
                        x: element.data[1].x,
                        y: element.data[1].y,
                        denomInBase: denomInBase,
                    },
                ],
                type: element.type,
                time: element.time,
                pool: element.pool,
                border: element.border,
                line: element.line,
                background: element.background,
                extraData: element.extraData,
                extendLeft: element.extendLeft,
                extendRight: element.extendRight,
                labelPlacement: element.labelPlacement,
                labelAlignment: element.labelAlignment,
                reverse: element.reverse,
            };

            if (!drawActionStack.has(actionKey)) {
                if (
                    (actionKey.tokenA === element.pool.tokenA &&
                        actionKey.tokenB === element.pool.tokenB) ||
                    (actionKey.tokenA === element.pool.tokenB &&
                        actionKey.tokenB === element.pool.tokenA)
                ) {
                    drawActionStack.set(actionKey, [tempData]);
                } else {
                    drawActionStack.set(actionKey, []);
                }
            } else {
                const actionList = drawActionStack
                    .get(actionKey)
                    ?.find((item) => item.time === element.time);
                if (
                    actionList === undefined &&
                    actionKey.tokenA === element.pool.tokenA &&
                    actionKey.tokenB === element.pool.tokenB
                ) {
                    drawActionStack.get(actionKey)?.push(tempData);
                }
            }
        });
    }, [actionKey]);

    const deleteItem = useCallback(
        (item: drawDataHistory) => {
            const actionList = drawActionStack.get(actionKey);

            if (actionList) {
                const findItem = actionList.find((i) => {
                    return (
                        JSON.stringify(i.data) === JSON.stringify(item.data) &&
                        i.time === item.time
                    );
                });

                if (findItem) {
                    const tempHistoryData = {
                        data: [
                            {
                                x: 0,
                                y: 0,
                                denomInBase: denomInBase,
                            },
                            {
                                x: 0,
                                y: 0,
                                denomInBase: denomInBase,
                            },
                        ],
                        type: findItem.type,
                        time: findItem.time,
                        pool: findItem.pool,
                        border: findItem.border,
                        line: findItem.line,
                        background: findItem.background,
                        extraData: findItem.extraData,
                        extendLeft: findItem.extendLeft,
                        extendRight: findItem.extendRight,
                        labelPlacement: findItem.labelPlacement,
                        labelAlignment: findItem.labelAlignment,
                        reverse: findItem.reverse,
                    };

                    drawActionStack.get(actionKey)?.push(tempHistoryData);
                }
            }
        },
        [actionKey, drawActionStack, denomInBase],
    );

    const undoDrawnShapeHistory = useCallback(
        (action: drawDataHistory) => {
            const actions = drawActionStack
                .get(actionKey)
                ?.filter((item) => item.time === action.time);

            let tempData: drawDataHistory | undefined = undefined;

            const index = drawnShapeHistory.findIndex(
                (item) =>
                    JSON.stringify(item.time) === JSON.stringify(action.time),
            );

            let lastActionData: drawDataHistory | undefined = undefined;

            if (actions && actions?.length > 0) {
                lastActionData = actions[actions?.length - 1];
                tempData = {
                    data: [
                        {
                            x: lastActionData.data[0].x,
                            y: lastActionData.data[0].y,
                            denomInBase: lastActionData.data[0].denomInBase,
                        },
                        {
                            x: lastActionData.data[1].x,
                            y: lastActionData.data[1].y,
                            denomInBase: lastActionData.data[0].denomInBase,
                        },
                    ],
                    type: lastActionData.type,
                    time: lastActionData.time,
                    pool: lastActionData.pool,
                    border: structuredClone(lastActionData.border),
                    line: structuredClone(lastActionData.line),
                    background: structuredClone(lastActionData.background),
                    extraData: structuredClone(lastActionData.extraData),
                    extendLeft: lastActionData.extendLeft,
                    extendRight: lastActionData.extendRight,
                    labelPlacement: lastActionData.labelPlacement,
                    labelAlignment: lastActionData.labelAlignment,
                    reverse: lastActionData.reverse,
                } as drawDataHistory;
            }

            setDrawnShapeHistory((prev) => {
                if (tempData) {
                    const shouldFill =
                        (action.data[0].x === 0 || action.data[0].x === -1) &&
                        (action.data[0].y === 0 || action.data[0].y === -1) &&
                        (action.data[1].x === 0 || action.data[1].x === -1) &&
                        (action.data[1].y === 0 || action.data[1].y === -1);

                    if (
                        shouldFill &&
                        JSON.stringify(lastActionData) !==
                            JSON.stringify(action) &&
                        index === -1
                    ) {
                        return [...prev, tempData];
                    } else {
                        const newDrawnShapeHistory = [...prev];
                        newDrawnShapeHistory[index] = tempData;

                        return newDrawnShapeHistory;
                    }
                } else {
                    const newDrawnShapeHistory = [...prev];
                    return newDrawnShapeHistory.filter(
                        (item) =>
                            JSON.stringify(item.data) !==
                            JSON.stringify(action.data),
                    );
                }
            });
        },
        [actionKey, drawActionStack, drawnShapeHistory, setDrawnShapeHistory],
    );

    const undo = useCallback(() => {
        const actionList = drawActionStack.get(actionKey);

        if (actionList) {
            const actionArray: Array<drawDataHistory | undefined> = [];

            if (
                actionList.length > 0 &&
                actionList[actionList.length - 1].data[0].x === -1 &&
                actionList[actionList.length - 1].data[0].y === -1
            ) {
                actionList.forEach((obj) => {
                    if (obj.data[0].x === -1 && obj.data[0].y === -1) {
                        const tempData = {
                            data: [
                                {
                                    x: obj.data[0].x,
                                    y: obj.data[0].y,
                                    denomInBase: obj.data[0].denomInBase,
                                },
                                {
                                    x: obj.data[1].x,
                                    y: obj.data[1].y,
                                    denomInBase: obj.data[0].denomInBase,
                                },
                            ],
                            type: obj.type,
                            time: obj.time,
                            pool: obj.pool,
                            border: structuredClone(obj.border),
                            line: structuredClone(obj.line),
                            background: structuredClone(obj.background),
                            extraData: structuredClone(obj.extraData),
                            extendLeft: obj.extendLeft,
                            extendRight: obj.extendRight,
                            labelPlacement: obj.labelPlacement,
                            labelAlignment: obj.labelAlignment,
                            reverse: obj.reverse,
                        } as drawDataHistory;

                        actionArray.push(tempData);
                    }
                });

                actionList.splice(actionArray.length, actionList.length);
            } else if (actionArray.length === 0) {
                actionArray.push(actionList.pop());
            }

            if (actionArray.length > 0) {
                actionArray.forEach((action) => {
                    if (action) {
                        undoDrawnShapeHistory(action);
                        if (!undoStack.has(actionKey)) {
                            undoStack.set(actionKey, []);
                        }

                        const undoStackList = undoStack.get(actionKey);

                        if (undoStackList) {
                            const lastDataUndoStack =
                                undoStackList[undoStackList?.length - 1];

                            const shouldFillWithActionData =
                                (action.data[0].x === 0 ||
                                    action.data[0].x === -1) &&
                                (action.data[0].y === 0 ||
                                    action.data[0].y === -1) &&
                                (action.data[1].x === 0 ||
                                    action.data[1].x === -1) &&
                                (action.data[1].y === 0 ||
                                    action.data[1].y === -1);

                            if (
                                undoStackList.length === 0 ||
                                !(
                                    lastDataUndoStack.time === action.time &&
                                    (lastDataUndoStack.data[0].x === 0 ||
                                        lastDataUndoStack.data[0].x === -1) &&
                                    (lastDataUndoStack.data[0].y === 0 ||
                                        lastDataUndoStack.data[0].y === -1) &&
                                    (lastDataUndoStack.data[1].x === 0 ||
                                        lastDataUndoStack.data[1].x === -1) &&
                                    (lastDataUndoStack.data[1].y === 0 ||
                                        lastDataUndoStack.data[1].y === -1) &&
                                    shouldFillWithActionData
                                )
                            ) {
                                undoStack.get(actionKey)?.push(action);
                            }
                        }
                    }
                });
            }
        }
    }, [actionKey, drawActionStack, undoDrawnShapeHistory, undoStack]);

    const redoDrawnShapeHistory = useCallback(
        (action: drawDataHistory) => {
            const tempData = {
                data: [
                    {
                        x: action.data[0].x,
                        y: action.data[0].y,
                        denomInBase: action.data[0].denomInBase,
                    },
                    {
                        x: action.data[1].x,
                        y: action.data[1].y,
                        denomInBase: action.data[0].denomInBase,
                    },
                ],
                type: action.type,
                time: action.time,
                pool: action.pool,
                border: structuredClone(action.border),
                line: structuredClone(action.line),
                background: structuredClone(action.background),
                extraData: structuredClone(action.extraData),
                extendLeft: action.extendLeft,
                extendRight: action.extendRight,
                labelPlacement: action.labelPlacement,
                labelAlignment: action.labelAlignment,
                reverse: action.reverse,
            } as drawDataHistory;

            if (
                action.data[0].x !== 0 &&
                action.data[0].y !== 0 &&
                action.data[1].x !== 0 &&
                action.data[1].y !== 0
            ) {
                const index = drawnShapeHistory.findIndex(
                    (item) => item.time === action.time,
                );

                setDrawnShapeHistory((prev) => {
                    const updatedHistory = [...prev];
                    if (index !== -1) {
                        updatedHistory[index] = tempData;
                        return updatedHistory;
                    } else {
                        return [...prev, tempData];
                    }
                });
            }
        },
        [drawnShapeHistory, setDrawnShapeHistory],
    );

    const redo = useCallback(() => {
        if (drawActionStack.has(actionKey)) {
            const undoActionList = undoStack.get(actionKey);
            if (undoActionList) {
                const lastValue = undoActionList[undoActionList?.length - 1];

                if (lastValue) {
                    if (undoActionList) {
                        drawActionStack.get(actionKey)?.push({
                            data: [
                                {
                                    x: lastValue.data[0].x,
                                    y: lastValue.data[0].y,
                                    denomInBase: lastValue.data[0].denomInBase,
                                },
                                {
                                    x: lastValue.data[1].x,
                                    y: lastValue.data[1].y,
                                    denomInBase: lastValue.data[0].denomInBase,
                                },
                            ],
                            pool: lastValue.pool,
                            time: lastValue.time,
                            type: lastValue.type,
                            border: structuredClone(lastValue.border),
                            line: structuredClone(lastValue.line),
                            background: structuredClone(lastValue.background),
                            extraData: structuredClone(lastValue.extraData),
                            extendLeft: lastValue.extendLeft,
                            extendRight: lastValue.extendRight,
                            labelPlacement: lastValue.labelPlacement,
                            labelAlignment: lastValue.labelAlignment,
                            reverse: lastValue.reverse,
                        });
                    }
                    if (undoActionList) {
                        const action = undoActionList.pop();
                        if (action) {
                            redoDrawnShapeHistory(action);
                        }
                    }
                }
            }
        }
    }, [actionKey, drawActionStack, undoStack, redoDrawnShapeHistory]);

    const addDrawActionStack = useCallback(
        (tempLastData: drawDataHistory, isNewShape: boolean) => {
            const tempDta = {
                data: structuredClone(tempLastData.data),
                type: tempLastData.type,
                time: tempLastData.time,
                pool: tempLastData.pool,
                border: structuredClone(tempLastData.border),
                line: structuredClone(tempLastData.line),
                background: structuredClone(tempLastData.background),
                extraData: structuredClone(tempLastData.extraData),
                extendLeft: tempLastData.extendLeft,
                extendRight: tempLastData.extendRight,
                labelPlacement: tempLastData.labelPlacement,
                labelAlignment: tempLastData.labelAlignment,
                reverse: tempLastData.reverse,
            };

            const tempMap = new Map<actionKeyIF, drawDataHistory[]>(
                drawActionStack,
            );

            if (drawActionStack.has(actionKey)) {
                const actions = drawActionStack.get(actionKey);

                if (actions) {
                    tempMap.set(actionKey, actions);

                    const values = tempMap.get(actionKey);
                    if (values) {
                        if (actions) {
                            actions.push(tempDta);
                        }
                    }
                }
                setDrawActionStack(tempMap);
            } else {
                drawActionStack.set(actionKey, [tempDta]);
            }

            if (isNewShape) {
                undoStack.clear();
            }
        },
        [actionKey, drawActionStack, setDrawActionStack, undoStack],
    );

    return {
        undo,
        redo,
        deleteItem,
        currentPool,
        drawnShapeHistory,
        setDrawnShapeHistory,
        drawActionStack,
        actionKey,
        addDrawActionStack,
        undoStack,
        deleteAllShapes,
    };
}
