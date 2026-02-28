<template>
  <div class="day-night-toggle">
    <!-- 核心切换组件 -->
    <div class="components" :style="{ backgroundColor: isMoved ? 'rgba(25,30,50,1)' : 'rgba(70, 133, 192,1)' }">
      <!-- 按钮主体 -->
      <div 
        class="main-button"
        :style="{
          transform: `translateX(${buttonX}px)`,
          backgroundColor: isMoved ? 'rgba(195, 200,210,1)' : 'rgba(255, 195, 35,1)',
          boxShadow: isMoved 
            ? '3px 3px 5px rgba(0, 0, 0, 0.5), inset  -3px -5px 3px -3px rgba(0, 0, 0, 0.5), inset  4px 5px 2px -2px rgba(255, 255, 210,1)'
            : '3px 3px 5px rgba(0, 0, 0, 0.5), inset  -3px -5px 3px -3px rgba(0, 0, 0, 0.5), inset  4px 5px 2px -2px rgba(255, 230, 80,1)'
        }"
        @click="handleClick"
        @mousemove="handleMouseMove"
        @mouseout="handleMouseOut"
      >
        <!-- 月亮陨石坑 -->
        <div 
          class="moon"
          :style="{ opacity: isMoved ? 1 : 0 }"
        ></div>
        <div 
          class="moon"
          :style="{ opacity: isMoved ? 1 : 0 }"
        ></div>
        <div 
          class="moon"
          :style="{ opacity: isMoved ? 1 : 0 }"
        ></div>
      </div>

      <!-- 按钮底层虚影 -->
      <div 
        class="daytime-backgrond"
        :style="{ transform: `translateX(${bgXList[0]}px)` }"
      ></div>
      <div 
        class="daytime-backgrond"
        :style="{ transform: `translateX(${bgXList[1]}px)` }"
      ></div>
      <div 
        class="daytime-backgrond"
        :style="{ transform: `translateX(${bgXList[2]}px)` }"
      ></div>

      <!-- 云层 -->
      <div 
        class="cloud"
        :style="{ transform: `translateY(${isMoved ? 80 : 10}px)` }"
      >
        <div 
          class="cloud-son"
          v-for="(item, index) in 6" 
          :key="`cloud-${index}`"
          :style="cloudSonStyle[index]"
        ></div>
      </div>

      <!-- 云层虚影 -->
      <div 
        class="cloud-light cloud-float"
        :style="{ transform: `translateY(${isMoved ? 80 : 10}px)` }"
      >
        <div 
          class="cloud-son"
          v-for="(item, index) in 6" 
          :key="`cloud-light-${index}`"
          :style="cloudLightSonStyle[index]"
        ></div>
      </div>

      <!-- 星星 -->
      <div 
        class="stars"
        :style="{
          transform: `translateY(${isMoved ? -62.5 : -125}px)`,
          opacity: isMoved ? 1 : 0
        }"
      >
        <div 
          class="star big"
          v-for="(item, index) in starList" 
          :key="`star-${index}`"
          :class="{ twinkle: twinkleStarIndex === index }"
          :style="{
            top: starPosList[index]?.top,
            left: starPosList[index]?.left
          }"
        >
          <div class="star-son"></div>
          <div class="star-son"></div>
          <div class="star-son"></div>
          <div class="star-son"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

// 核心状态
const isMoved = ref(false); // false=白天 true=黑夜
const isClicked = ref(false); // 防止点击后立即触发鼠标移入/移出
const buttonX = ref(0); // 按钮X轴偏移
const bgXList = ref([0, 0, 0]); // 背景虚影X轴偏移
const twinkleStarIndex = ref(-1); // 闪烁的星星索引
const starList = ref([...Array(6)].map(() => ({}))); // 星星列表
const starPosList = ref([
  { top: '11px', left: '39px' },
  { top: '39px', left: '91px' },
  { top: '26px', left: '19px' },
  { top: '37px', left: '66px' },
  { top: '21px', left: '75px' },
  { top: '51px', left: '38px' }
]); // 星星初始位置

// 云朵随机移动相关
const cloudSonStyle = ref([]);
const cloudLightSonStyle = ref([]);
let cloudTimer = null;
let twinkleTimer = null;

// 点击切换白天/黑夜
const handleClick = () => {
  isClicked.value = true;
  isMoved.value = !isMoved.value;
  
  // 重置按钮位置
  buttonX.value = isMoved.value ? 110 : 0;
  // 重置背景虚影位置
  bgXList.value = isMoved.value ? [110, 80, 50] : [0, 0, 0];

  // 500ms后解除点击锁定
  setTimeout(() => {
    isClicked.value = false;
  }, 500);

  // 触发父组件事件（传递当前模式）
  emit('change', isMoved.value ? 'dark' : 'light');
};

// 鼠标移入按钮
const handleMouseMove = () => {
  if (isClicked.value) return;

  if (isMoved.value) {
    // 黑夜状态 - 左移10px
    buttonX.value = 100;
    bgXList.value = [100, 73, 46];
    
    // 星星扩散
    starPosList.value = [
      { top: '10px', left: '36px' },
      { top: '40px', left: '87px' },
      { top: '26px', left: '16px' },
      { top: '38px', left: '63px' },
      { top: '20.5px', left: '72px' },
      { top: '51.5px', left: '35px' }
    ];
  } else {
    // 白天状态 - 右移10px
    buttonX.value = 10;
    bgXList.value = [10, 7, 4];
    
    // 云朵扩散
    cloudSonStyle.value = [
      { right: '-24px', bottom: '10px' },
      { right: '-12px', bottom: '-27px' },
      { right: '17px', bottom: '-43px' },
      { right: '46px', bottom: '-39px' },
      { right: '70px', bottom: '-65px' },
      { right: '109px', bottom: '-54px' }
    ];
    cloudLightSonStyle.value = [
      { right: '-23px', bottom: '10px' },
      { right: '-11px', bottom: '-26px' },
      { right: '18px', bottom: '-42px' },
      { right: '47px', bottom: '-38px' },
      { right: '74px', bottom: '-64px' },
      { right: '110px', bottom: '-55px' }
    ];
  }
};

// 鼠标移出按钮
const handleMouseOut = () => {
  if (isClicked.value) return;

  if (isMoved.value) {
    // 黑夜状态 - 恢复原位
    buttonX.value = 110;
    bgXList.value = [110, 80, 50];
    
    // 星星归位
    starPosList.value = [
      { top: '11px', left: '39px' },
      { top: '39px', left: '91px' },
      { top: '26px', left: '19px' },
      { top: '37px', left: '66px' },
      { top: '21px', left: '75px' },
      { top: '51px', left: '38px' }
    ];
  } else {
    // 白天状态 - 恢复原位
    buttonX.value = 0;
    bgXList.value = [0, 0, 0];
    
    // 云朵归位
    cloudSonStyle.value = [
      { right: '-20px', bottom: '10px' },
      { right: '-10px', bottom: '-25px' },
      { right: '20px', bottom: '-40px' },
      { right: '50px', bottom: '-35px' },
      { right: '75px', bottom: '-60px' },
      { right: '110px', bottom: '-50px' }
    ];
    cloudLightSonStyle.value = [
      { right: '-20px', bottom: '10px' },
      { right: '-10px', bottom: '-25px' },
      { right: '20px', bottom: '-40px' },
      { right: '50px', bottom: '-35px' },
      { right: '75px', bottom: '-60px' },
      { right: '110px', bottom: '-50px' }
    ];
  }
};

// 星星闪烁逻辑
const twinkleStars = () => {
  const starArray = [...Array(6)].map((_, index) => index).sort(() => 0.5 - Math.random());
  const twinkleDuration = 500; // 闪烁时长
  const pauseDuration = 2000; // 暂停时长

  starArray.forEach((starIndex, index) => {
    setTimeout(() => {
      twinkleStarIndex.value = starIndex;
      setTimeout(() => {
        twinkleStarIndex.value = -1;
        if (index === starArray.length - 1) {
          setTimeout(twinkleStars, pauseDuration);
        }
      }, twinkleDuration);
    }, index * (twinkleDuration + pauseDuration));
  });
};

// 云朵随机移动
const getRandomDirection = () => {
  const directions = ['2px', '-2px'];
  return directions[Math.floor(Math.random() * directions.length)];
};

const moveCloudRandomly = () => {
  // 更新云朵位置
  cloudSonStyle.value = cloudSonStyle.value.map(() => ({
    transform: `translate(${getRandomDirection()}, ${getRandomDirection()})`
  }));
  cloudLightSonStyle.value = cloudLightSonStyle.value.map(() => ({
    transform: `translate(${getRandomDirection()}, ${getRandomDirection()})`
  }));
};

// 初始化云朵样式
const initCloudStyle = () => {
  cloudSonStyle.value = [...Array(6)].map(() => ({
    right: '-20px',
    bottom: '10px',
    transform: 'translate(0, 0)'
  }));
  cloudLightSonStyle.value = [...Array(6)].map(() => ({
    right: '-20px',
    bottom: '10px',
    transform: 'translate(0, 0)'
  }));
};

// 生命周期
onMounted(() => {
  // 初始化云朵样式
  initCloudStyle();
  
  // 启动云朵随机移动定时器
  cloudTimer = setInterval(moveCloudRandomly, 1000);
  
  // 启动星星闪烁
  twinkleStars();

  // 同步body背景色（可选）
  document.body.style.backgroundColor = isMoved.value ? '#424242' : 'aliceblue';
});

onUnmounted(() => {
  // 清除定时器
  clearInterval(cloudTimer);
  clearTimeout(twinkleTimer);
});

// 监听模式变化，同步body背景色（可选）
watch(isMoved, (newVal) => {
  document.body.style.backgroundColor = newVal ? '#424242' : 'aliceblue';
});

// 定义组件事件
const emit = defineEmits(['change']);
</script>

<style scoped>
/* 全局样式重置 */
.day-night-toggle * {
  margin: 0;
  padding: 0;
  transition: 0.7s;
}

/* 组件容器 */
.day-night-toggle {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

/* 最外层元素样式 */
.components {
  position: relative;
  width: 180px;
  height: 70px;
  border-radius: 100px;
  box-shadow: inset 0 0 5px 3px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: 0.7s cubic-bezier(0, 0.5, 1, 1);
}

/* 主要按钮样式 */
.main-button {
  position: relative;
  margin: 7.5px 0 0 7.5px;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  cursor: pointer;
  transition: 1.0s cubic-bezier(0.56, 1.35, 0.52, 1.00);
  z-index: 10;
}

/* 陨石坑样式 */
.moon {
  position: absolute;
  background-color: rgba(150, 160, 180, 1);
  box-shadow: inset 0px 0px 1px 1px rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  transition: 0.5s;
}

.moon:nth-child(1) {
  top: 7.5px;
  left: 25px;
  width: 12.5px;
  height: 12.5px;
}

.moon:nth-child(2) {
  top: 20px;
  left: 7.5px;
  width: 20px;
  height: 20px;
}

.moon:nth-child(3) {
  top: 35px;
  left: 20px;
  width: 15px;
  height: 15px;
}

/* 按钮底层虚影 */
.daytime-backgrond {
  position: absolute;
  top: 7.5px;
  left: 7.5px;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 1.0s cubic-bezier(0.56, 1.35, 0.52, 1.00);
  z-index: 1;
}

.daytime-backgrond:nth-child(3) {
  z-index: 2;
  opacity: 0.8;
}

.daytime-backgrond:nth-child(4) {
  z-index: 3;
  opacity: 0.6;
}

/* 云层样式 */
.cloud, .cloud-light {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 150px;
  height: 60px;
  transition: 0.7s cubic-bezier(0, 0.5, 1, 1);
  z-index: 5;
}

.cloud-light {
  opacity: 0.5;
  z-index: 4;
}

.cloud-son {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: 0.5s;
  width: 25px;
  height: 25px;
}

/* 星星样式 */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.7s cubic-bezier(0, 0.5, 1, 1);
  z-index: 1;
  opacity: 0;
}

.star {
  position: absolute;
  transition: 0.5s;
}

.star.big {
  width: 15px;
  height: 15px;
}

.star.medium {
  width: 10px;
  height: 10px;
}

.star.small {
  width: 5px;
  height: 5px;
}

.star-son {
  position: absolute;
  background-color: #fff;
  border-radius: 50%;
}

/* 星星闪烁动画 */
.twinkle {
  animation: twinkle 0.5s ease-in-out;
}

@keyframes twinkle {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
