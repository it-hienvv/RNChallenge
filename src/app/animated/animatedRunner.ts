import Animated, { Clock, EasingNode, Value, block, cond, and, not, clockRunning, startClock, set, timing as timing2, stopClock } from "react-native-reanimated";

interface TimingAnimation {
    state: Animated.TimingState;
    config: Animated.TimingConfig;
  }
  
  interface SpringAnimation {
    state: Animated.SpringState;
    config: Animated.SpringConfig;
  }
  
  interface DecayAnimation {
    state: Animated.DecayState;
    config: Animated.DecayConfig;
  }
type Animation = SpringAnimation | DecayAnimation | TimingAnimation;
interface AnimateParams<S, C> {
    clock: Animated.Clock;
    fn: (
      clock: Animated.Clock,
      state: S,
      config: C,
    ) => Animated.Adaptable<number>;
    state: S;
    config: C;
    from: Animated.Adaptable<number>;
  }
const animate = <T extends Animation>({
    fn,
    clock,
    state,
    config,
    from,
  }: AnimateParams<T['state'], T['config']>) =>
    block([
      cond(not(clockRunning(clock)), [
        set(state.finished, 0),
        set(state.time, 0),
        set(state.position, from),
        startClock(clock),
      ]),
      fn(clock, state, config),
      cond(state.finished, stopClock(clock)),
      state.position,
    ]);

export interface TimingParams {
    clock?: Animated.Clock;
    from?: Animated.Adaptable<number>;
    to?: Animated.Adaptable<number>;
    duration?: Animated.Adaptable<number>;
    easing?: Animated.EasingNodeFunction;
}

export const timing = (params: TimingParams) => {
    const { clock, easing, duration, from, to } = {
        clock: new Clock(),
        easing: EasingNode.linear,
        duration: 250,
        from: 0,
        to: 1,
        ...params,
    };

    const state: Animated.TimingState = {
        finished: new Value(0),
        position: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
    };

    const config = {
        toValue: new Value(0),
        duration,
        easing,
    };

    return block([
        cond(not(clockRunning(clock)), [
            set(config.toValue, to),
            set(state.frameTime, 0),
        ]),
        animate<TimingAnimation>({
            clock,
            fn: timing2,
            state,
            config,
            from,
        }),
    ]);
};
export const delayV1 = (node: Animated.Node<number>, duration: number) => {
    const clock = new Clock();
    return block([
        timing({ clock, from: 0, to: 1, duration }),
        cond(not(clockRunning(clock)), node),
    ]);
};
export interface LoopProps {
    clock?: Animated.Clock;
    easing?: Animated.EasingNodeFunction;
    duration?: number;
    boomerang?: boolean;
    autoStart?: boolean;
}

export const loop = (loopConfig: LoopProps) => {
    const { clock, easing, duration, boomerang, autoStart } = {
        clock: new Clock(),
        easing: EasingNode.linear,
        duration: 250,
        boomerang: false,
        autoStart: true,
        ...loopConfig,
    };
    const state = {
        finished: new Value(0),
        position: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
    };
    const config = {
        toValue: new Value(1),
        duration,
        easing,
    };

    return block([
        cond(and(not(clockRunning(clock)), autoStart ? 1 : 0), startClock(clock)),
        timing2(clock, state, config),
        cond(state.finished, [
            set(state.finished, 0),
            set(state.time, 0),
            set(state.frameTime, 0),
            boomerang
                ? set(config.toValue, cond(config.toValue, 0, 1))
                : set(state.position, 0),
        ]),
        state.position,
    ]);
};