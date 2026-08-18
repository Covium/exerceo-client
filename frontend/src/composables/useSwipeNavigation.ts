import {
  computed,
  defineAsyncComponent,
  nextTick,
  onUnmounted,
  ref,
  watch,
  type Component,
  type CSSProperties,
  type Ref,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const MOBILE_LAYOUT = '(max-width: 47.999rem)';
const MIN_DISTANCE_PX = 64;
const LOCK_DISTANCE_PX = 12;
const MAX_OFF_AXIS_PX = 72;
const ANIMATION_MS = 300;
const RUBBER_BAND = 0.28;
const VELOCITY_COMMIT = 0.45;

const VIEW_BY_PATH = {
  '/': defineAsyncComponent(() => import('@/views/DashboardView.vue')),
  '/history': defineAsyncComponent(() => import('@/views/HistoryView.vue')),
  '/measurements': defineAsyncComponent(
    () => import('@/views/MeasurementsView.vue'),
  ),
  '/groups': defineAsyncComponent(() => import('@/views/GroupsView.vue')),
  '/settings': defineAsyncComponent(() => import('@/views/SettingsView.vue')),
} as const;

type ViewPath = keyof typeof VIEW_BY_PATH;

type NavItem = {
  to: string;
  key: string;
};

function viewFor(path: string): Component {
  if (Object.hasOwn(VIEW_BY_PATH, path)) {
    return VIEW_BY_PATH[path as ViewPath];
  }
  return VIEW_BY_PATH['/'];
}

type Jump = {
  from: number;
  to: number;
};

export function useSwipeNavigation(
  items: readonly NavItem[],
  container: Ref<HTMLElement | null>,
) {
  const route = useRoute();
  const router = useRouter();

  const visualItems = computed(() =>
    [...items].reverse().map((item) => ({
      to: item.to,
      key: item.key,
      component: viewFor(item.to),
    })),
  );

  const isMobile = ref(false);
  const viewportWidth = ref(0);
  const displayedIndex = ref(0);
  const dragX = ref(0);
  const useTransition = ref(false);
  const jump = ref<Jump | null>(null);
  const dragging = ref(false);

  let startX = 0;
  let startY = 0;
  let startTarget: EventTarget | null = null;
  let tracking = false;
  let cancelled = false;
  let locked = false;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let pendingIndex: number | null = null;
  let animationGen = 0;
  let media: MediaQueryList | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function indexForPath(path: string): number {
    return visualItems.value.findIndex((item) => item.to === path);
  }

  function syncIndexFromRoute(): void {
    const index = indexForPath(route.path);
    if (index >= 0) {
      displayedIndex.value = index;
    }
    dragX.value = 0;
    jump.value = null;
    useTransition.value = false;
    pendingIndex = null;
  }

  function updateMobile(): void {
    const next = media?.matches ?? false;
    if (next === isMobile.value) {
      return;
    }
    isMobile.value = next;
    if (next) {
      syncIndexFromRoute();
    }
  }

  function measure(): void {
    viewportWidth.value = container.value?.clientWidth ?? 0;
  }

  function isFromEditable(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }
    return Boolean(
      target.closest('input, textarea, select, [contenteditable="true"]'),
    );
  }

  function isFromHorizontalScroll(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    let element: Element | null = target;
    while (element && element !== container.value) {
      const style = window.getComputedStyle(element);
      const canScrollX =
        style.overflowX === 'auto' || style.overflowX === 'scroll';
      if (canScrollX && element.scrollWidth > element.clientWidth + 1) {
        return true;
      }
      element = element.parentElement;
    }

    return false;
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function paint(): Promise<void> {
    await nextTick();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  function appliedDrag(raw: number, index: number): number {
    const atStart = index <= 0;
    const atEnd = index >= visualItems.value.length - 1;
    if ((atStart && raw > 0) || (atEnd && raw < 0)) {
      return raw * RUBBER_BAND;
    }
    return raw;
  }

  function offsetPx(index: number): number {
    const width = viewportWidth.value;
    const currentJump = jump.value;
    if (currentJump) {
      const dir = currentJump.to >= currentJump.from ? 1 : -1;
      if (index === currentJump.from) {
        return dragX.value;
      }
      if (index === currentJump.to) {
        return dir * width + dragX.value;
      }
      return dir * width * 2;
    }
    return (index - displayedIndex.value) * width + dragX.value;
  }

  function paneStyle(index: number): CSSProperties {
    const width = viewportWidth.value;
    const x = offsetPx(index);
    const currentJump = jump.value;
    const nearby =
      currentJump !== null
        ? index === currentJump.from || index === currentJump.to
        : Math.abs(x) < width || Math.abs(index - displayedIndex.value) <= 1;
    const duration = prefersReducedMotion() ? 0 : ANIMATION_MS;
    const visible = width > 0 && nearby;

    return {
      transform: `translate3d(${x}px, 0, 0)`,
      transition: useTransition.value
        ? `transform ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`
        : 'none',
      pointerEvents:
        index === displayedIndex.value &&
        !dragging.value &&
        pendingIndex === null
          ? 'auto'
          : 'none',
      visibility:
        visible || (width === 0 && index === displayedIndex.value)
          ? 'visible'
          : 'hidden',
      zIndex: nearby ? 1 : 0,
    };
  }

  function resetGesture(): void {
    tracking = false;
    cancelled = false;
    locked = false;
    dragging.value = false;
    startTarget = null;
    velocity = 0;
  }

  async function settleDrag(targetX: number, nextIndex: number): Promise<void> {
    const gen = ++animationGen;
    pendingIndex = nextIndex;
    if (prefersReducedMotion() || targetX === dragX.value) {
      displayedIndex.value = nextIndex;
      dragX.value = 0;
      pendingIndex = null;
      return;
    }

    useTransition.value = true;
    dragX.value = targetX;
    await wait(ANIMATION_MS);
    if (gen !== animationGen) {
      return;
    }
    useTransition.value = false;
    displayedIndex.value = nextIndex;
    dragX.value = 0;
    pendingIndex = null;
  }

  async function animateJump(from: number, to: number): Promise<void> {
    const gen = ++animationGen;
    pendingIndex = to;
    if (prefersReducedMotion() || from === to) {
      displayedIndex.value = to;
      jump.value = null;
      dragX.value = 0;
      pendingIndex = null;
      return;
    }

    const dir = to >= from ? 1 : -1;
    jump.value = { from, to };
    dragX.value = 0;
    useTransition.value = false;
    await paint();
    if (gen !== animationGen) {
      return;
    }

    useTransition.value = true;
    dragX.value = -dir * viewportWidth.value;
    await wait(ANIMATION_MS);
    if (gen !== animationGen) {
      return;
    }

    useTransition.value = false;
    displayedIndex.value = to;
    jump.value = null;
    dragX.value = 0;
    pendingIndex = null;
  }

  function onTouchStart(event: TouchEvent): void {
    if (
      !isMobile.value ||
      event.touches.length !== 1 ||
      pendingIndex !== null
    ) {
      resetGesture();
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      resetGesture();
      return;
    }

    startX = touch.clientX;
    startY = touch.clientY;
    lastX = touch.clientX;
    lastT = performance.now();
    startTarget = event.target;
    tracking = true;
    cancelled = false;
    locked = false;
    velocity = 0;
    dragging.value = false;
  }

  function onTouchMove(event: TouchEvent): void {
    if (!tracking || cancelled || !isMobile.value) {
      return;
    }
    if (event.touches.length !== 1) {
      cancelled = true;
      dragging.value = false;
      dragX.value = 0;
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const now = performance.now();
    velocity = (touch.clientX - lastX) / Math.max(1, now - lastT);
    lastX = touch.clientX;
    lastT = now;

    if (!locked) {
      if (Math.abs(dy) > MAX_OFF_AXIS_PX && Math.abs(dy) > Math.abs(dx)) {
        cancelled = true;
        return;
      }
      if (Math.abs(dx) < LOCK_DISTANCE_PX || Math.abs(dx) < Math.abs(dy)) {
        return;
      }
      if (isFromEditable(startTarget) || isFromHorizontalScroll(startTarget)) {
        cancelled = true;
        return;
      }
      locked = true;
      dragging.value = true;
    }

    event.preventDefault();
    dragX.value = appliedDrag(dx, displayedIndex.value);
  }

  function onTouchEnd(event: TouchEvent): void {
    const origin = startTarget;
    const wasLocked = locked;
    const currentDrag = dragX.value;
    const currentVelocity = velocity;
    const shouldIgnore =
      !tracking || cancelled || !isMobile.value || !wasLocked;
    resetGesture();
    if (shouldIgnore) {
      dragX.value = 0;
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch || isFromEditable(origin) || isFromHorizontalScroll(origin)) {
      void settleDrag(0, displayedIndex.value);
      return;
    }

    const width = viewportWidth.value;
    const atStart = displayedIndex.value <= 0;
    const atEnd = displayedIndex.value >= visualItems.value.length - 1;
    const goingNext =
      currentDrag < 0 &&
      !atEnd &&
      (Math.abs(currentDrag) >= MIN_DISTANCE_PX ||
        currentVelocity <= -VELOCITY_COMMIT);
    const goingPrev =
      currentDrag > 0 &&
      !atStart &&
      (Math.abs(currentDrag) >= MIN_DISTANCE_PX ||
        currentVelocity >= VELOCITY_COMMIT);

    if (!goingNext && !goingPrev) {
      void settleDrag(0, displayedIndex.value);
      return;
    }

    const dir = goingNext ? 1 : -1;
    const nextIndex = displayedIndex.value + dir;
    const next = visualItems.value[nextIndex];
    if (!next) {
      void settleDrag(0, displayedIndex.value);
      return;
    }

    pendingIndex = nextIndex;
    void router.push(next.to);
    void settleDrag(-dir * width, nextIndex);
  }

  function onTouchCancel(): void {
    const index = displayedIndex.value;
    resetGesture();
    void settleDrag(0, index);
  }

  function onMediaChange(): void {
    updateMobile();
    measure();
  }

  watch(
    () => route.path,
    (path) => {
      if (!isMobile.value) {
        return;
      }
      const index = indexForPath(path);
      if (
        index < 0 ||
        index === displayedIndex.value ||
        index === pendingIndex
      ) {
        return;
      }
      void animateJump(displayedIndex.value, index);
    },
  );

  watch(
    container,
    (element, previous) => {
      if (previous) {
        previous.removeEventListener('touchstart', onTouchStart);
        previous.removeEventListener('touchmove', onTouchMove);
        previous.removeEventListener('touchend', onTouchEnd);
        previous.removeEventListener('touchcancel', onTouchCancel);
        resizeObserver?.unobserve(previous);
      }
      if (!element) {
        return;
      }
      element.addEventListener('touchstart', onTouchStart, { passive: true });
      element.addEventListener('touchmove', onTouchMove, { passive: false });
      element.addEventListener('touchend', onTouchEnd, { passive: true });
      element.addEventListener('touchcancel', onTouchCancel, { passive: true });
      resizeObserver?.observe(element);
      measure();
    },
    { flush: 'post' },
  );

  media = window.matchMedia(MOBILE_LAYOUT);
  isMobile.value = media.matches;
  syncIndexFromRoute();
  media.addEventListener('change', onMediaChange);
  resizeObserver = new ResizeObserver(measure);
  if (container.value) {
    resizeObserver.observe(container.value);
    measure();
  }

  onUnmounted(() => {
    animationGen += 1;
    media?.removeEventListener('change', onMediaChange);
    const element = container.value;
    if (element) {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchCancel);
    }
    resizeObserver?.disconnect();
  });

  return {
    isMobile,
    visualItems,
    displayedIndex,
    paneStyle,
  };
}
