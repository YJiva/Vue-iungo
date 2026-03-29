<template>
  <div class="page-messages">
    <div class="container container-inner dm-wrap">
      <div class="dm-left">
        <div class="dm-title">私信会话</div>
        <div v-if="convLoading" class="dm-loading">加载中...</div>
        <div v-else-if="!conversations.length" class="dm-empty">暂无会话</div>
        <div v-else class="dm-list">
          <div
            v-for="item in conversations"
            :key="item.conversationId"
            class="dm-item"
            :class="{ active: activePeerId === item.peerId }"
            @click="selectPeer(item.peerId)"
          >
            <el-avatar :src="item.peerAvatar" :size="32" />
            <div class="dm-item-main">
              <div class="name">{{ item.peerNickname || item.peerUsername || ('用户' + item.peerId) }}</div>
              <div class="time">{{ item.lastMsgTime || '' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dm-right">
        <div class="dm-head">与 {{ activePeerLabel }} 的私信</div>
        <div class="dm-messages" ref="msgBoxRef">
          <div v-if="msgLoading" class="dm-loading">加载中...</div>
          <div v-else-if="!messages.length" class="dm-empty">暂无消息</div>
          <div v-else>
            <div v-for="m in orderedMessages" :key="m.id" class="msg-row" :class="{ mine: m.senderId === currentUserId }">
              <div class="bubble">{{ m.content }}</div>
            </div>
          </div>
        </div>
        <div class="dm-send">
          <div class="toolbar">
            <el-select v-model="form.msgType" size="small" style="width: 120px;">
              <el-option :value="1" label="文字/表情" />
              <el-option :value="2" label="图片" />
              <el-option :value="3" label="视频" />
              <el-option :value="4" label="混合" />
            </el-select>
            <el-button size="small" @click="appendEmoji('😀')">😀</el-button>
            <el-button size="small" @click="appendEmoji('😂')">😂</el-button>
            <el-upload
              v-if="form.msgType === 2 || form.msgType === 4"
              :show-file-list="false"
              :action="uploadImageApi"
              name="file"
              :on-success="onImageUploaded"
              :on-error="onUploadError"
            >
              <el-button size="small">上传图片</el-button>
            </el-upload>
            <el-upload
              v-if="form.msgType === 3 || form.msgType === 4"
              :show-file-list="false"
              :action="uploadVideoApi"
              name="file"
              :on-success="onVideoUploaded"
              :on-error="onUploadError"
            >
              <el-button size="small">上传视频</el-button>
            </el-upload>
          </div>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="输入消息内容。图片/视频可直接发送URL或上传后自动填入。"
          />
          <div class="send-row">
            <el-button type="primary" :disabled="!activePeerId" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'

const route = useRoute()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

const conversations = ref([])
const convLoading = ref(false)
const messages = ref([])
const msgLoading = ref(false)
const activePeerId = ref(null)
const msgBoxRef = ref(null)
const form = ref({
  msgType: 1,
  content: ''
})

const uploadImageApi = `${import.meta.env.VITE_API_BASE || ''}/api/file/upload-editor-image`
const uploadVideoApi = `${import.meta.env.VITE_API_BASE || ''}/api/file/upload-editor-video`

const activePeerLabel = computed(() => {
  const hit = conversations.value.find((x) => x.peerId === activePeerId.value)
  return hit ? (hit.peerNickname || hit.peerUsername || ('用户' + hit.peerId)) : '未知用户'
})

const orderedMessages = computed(() => [...messages.value].reverse())

const loadConversations = async () => {
  convLoading.value = true
  try {
    const res = await request.get('/api/dm/conversations', { limit: 50 })
    if (res.data?.code === 200) {
      conversations.value = res.data.data || []
    } else {
      ElMessage.error(res.data?.msg || '加载会话失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    convLoading.value = false
  }
}

const loadMessages = async () => {
  if (!activePeerId.value) return
  msgLoading.value = true
  try {
    const res = await request.get('/api/dm/messages', { peerId: activePeerId.value, limit: 50 })
    if (res.data?.code === 200) {
      messages.value = res.data.data || []
      await nextTick()
      if (msgBoxRef.value) msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight
    } else {
      ElMessage.error(res.data?.msg || '加载消息失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    msgLoading.value = false
  }
}

const selectPeer = async (peerId) => {
  activePeerId.value = peerId
  await loadMessages()
}

const appendEmoji = (emoji) => {
  form.value.content = `${form.value.content || ''}${emoji}`
}

const onImageUploaded = (res) => {
  if (res?.code === 200 && res?.data?.url) {
    form.value.content = [form.value.content, `image:${res.data.url}`].filter(Boolean).join('\n')
  } else {
    ElMessage.error(res?.msg || '图片上传失败')
  }
}

const onVideoUploaded = (res) => {
  if (res?.code === 200 && res?.data?.url) {
    form.value.content = [form.value.content, `video:${res.data.url}`].filter(Boolean).join('\n')
  } else {
    ElMessage.error(res?.msg || '视频上传失败')
  }
}

const onUploadError = () => {
  ElMessage.error('上传失败')
}

const sendMessage = async () => {
  if (!activePeerId.value) {
    ElMessage.warning('请先选择会话对象')
    return
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('消息内容不能为空')
    return
  }
  try {
    const payload = {
      receiverId: activePeerId.value,
      msgType: form.value.msgType,
      content: form.value.content
    }
    const res = await request.post('/api/dm/send', payload)
    if (res.data?.code === 200) {
      form.value.content = ''
      ElMessage.success('发送成功')
      await Promise.all([loadConversations(), loadMessages()])
    } else {
      ElMessage.error(res.data?.msg || '发送失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

onMounted(async () => {
  await loadConversations()
  const qPeer = Number(route.query.peerId)
  if (qPeer) {
    activePeerId.value = qPeer
  } else if (conversations.value.length) {
    activePeerId.value = conversations.value[0].peerId
  }
  if (activePeerId.value) {
    await loadMessages()
  }
})
</script>

<style scoped>
.page-messages { padding: 20px 0; }
.dm-wrap { display: grid; grid-template-columns: 280px 1fr; gap: 12px; }
.dm-left, .dm-right { background: #fff; border: 1px solid #eee; border-radius: 8px; }
.dm-title, .dm-head { padding: 12px; border-bottom: 1px solid #f0f0f0; font-weight: 600; }
.dm-list { max-height: 600px; overflow: auto; }
.dm-item { display: flex; gap: 8px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f6f6f6; }
.dm-item.active { background: #f5faff; }
.dm-item-main { display: flex; justify-content: space-between; width: 100%; gap: 8px; }
.dm-item .name { font-size: 14px; }
.dm-item .time { font-size: 12px; color: #999; }
.dm-messages { height: 420px; overflow: auto; padding: 12px; background: #fafafa; }
.msg-row { display: flex; margin-bottom: 8px; }
.msg-row.mine { justify-content: flex-end; }
.bubble { max-width: 70%; padding: 8px 10px; border-radius: 8px; background: #fff; border: 1px solid #eee; white-space: pre-wrap; word-break: break-word; }
.msg-row.mine .bubble { background: #e8f5ff; border-color: #cce9ff; }
.dm-send { padding: 10px 12px 12px; border-top: 1px solid #f0f0f0; }
.toolbar { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; flex-wrap: wrap; }
.send-row { margin-top: 8px; text-align: right; }
.dm-loading, .dm-empty { padding: 12px; color: #999; }
</style>

