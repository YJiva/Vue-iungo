<template>
  <div>
    <h2 class="section-title">站点设置</h2>

    <el-card class="block">
      <template #header>
        <div class="card-title">基础信息</div>
      </template>
      <el-form :model="form" label-width="120px">
        <el-form-item label="网站标题">
          <el-input v-model="form.title" placeholder="浏览器标题" />
        </el-form-item>
        <el-form-item label="Logo 地址">
          <div class="image-field">
            <el-input v-model="form.logoUrl" placeholder="建议 /upload/... 或 https://...">
              <template #append>
                <el-upload
                  :action="uploadAction"
                  :show-file-list="false"
                  :headers="uploadHeaders"
                  :before-upload="beforeImageUpload"
                  :on-success="(res) => handleConfigUploadSuccess('logoUrl', res)"
                  :on-error="handleUploadError"
                >
                  <el-button>上传</el-button>
                </el-upload>
              </template>
            </el-input>
            <el-image
              v-if="form.logoUrl"
              :src="form.logoUrl"
              fit="cover"
              class="preview-thumb"
              :preview-src-list="[form.logoUrl]"
              preview-teleported
            />
          </div>
        </el-form-item>
        <el-form-item label="标签 Icon">
          <div class="image-field">
            <el-input v-model="form.faviconUrl" placeholder="favicon 地址">
              <template #append>
                <el-upload
                  :action="uploadAction"
                  :show-file-list="false"
                  :headers="uploadHeaders"
                  :before-upload="beforeImageUpload"
                  :on-success="(res) => handleConfigUploadSuccess('faviconUrl', res)"
                  :on-error="handleUploadError"
                >
                  <el-button>上传</el-button>
                </el-upload>
              </template>
            </el-input>
            <el-image
              v-if="form.faviconUrl"
              :src="form.faviconUrl"
              fit="cover"
              class="preview-thumb"
              :preview-src-list="[form.faviconUrl]"
              preview-teleported
            />
          </div>
        </el-form-item>
        <el-form-item label="备案号">
          <el-input v-model="form.icpNo" placeholder="例如：粤ICP备xxxx号" />
        </el-form-item>
        <el-form-item label="站点副标题">
          <el-input v-model="form.subtitle" placeholder="导航栏副标题" />
        </el-form-item>

        <el-form-item label="页脚主文案">
          <el-input v-model="form.footerText" placeholder="页脚主文案" />
        </el-form-item>
        <el-form-item label="页脚补充">
          <el-input v-model="form.footerExtra" placeholder="页脚补充信息" />
        </el-form-item>
      </el-form>
      <div class="actions">
        <el-button type="primary" :loading="savingConfig" @click="saveConfig">保存基础信息</el-button>
      </div>
    </el-card>

    <el-card class="block">
      <template #header>
        <div class="card-title">轮播图</div>
      </template>

      <div class="carousel-actions">
        <el-button type="success" @click="addCarousel">新增轮播项</el-button>
        <el-button type="primary" :loading="savingCarousels" @click="saveCarousels">保存轮播图</el-button>
      </div>

      <el-table :data="carousels" size="small" style="width: 100%;">
        <el-table-column label="标题" min-width="180">
          <template #default="scope">
            <el-input v-model="scope.row.title" placeholder="标题" />
          </template>
        </el-table-column>
        <el-table-column label="图片地址" min-width="320">
          <template #default="scope">
            <div class="image-field">
              <el-input v-model="scope.row.imageUrl" placeholder="图片 URL">
                <template #append>
                  <el-upload
                    :action="uploadAction"
                    :show-file-list="false"
                    :headers="uploadHeaders"
                    :before-upload="beforeImageUpload"
                    :on-success="(res) => handleCarouselUploadSuccess(scope.$index, res)"
                    :on-error="handleUploadError"
                  >
                    <el-button>上传</el-button>
                  </el-upload>
                </template>
              </el-input>
              <el-image
                v-if="scope.row.imageUrl"
                :src="scope.row.imageUrl"
                fit="cover"
                class="preview-thumb"
                :preview-src-list="[scope.row.imageUrl]"
                preview-teleported
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="跳转链接" min-width="220">
          <template #default="scope">
            <el-input v-model="scope.row.linkUrl" placeholder="/home 或 https://..." />
          </template>
        </el-table-column>
        <el-table-column label="排序" width="180">
          <template #default="scope">
            <el-input-number v-model="scope.row.sort" :min="0" :max="9999" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="scope">
            <el-button type="danger" size="small" @click="removeCarousel(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSiteStore } from '../../stores/site'

const siteStore = useSiteStore()
const savingConfig = ref(false)
const savingCarousels = ref(false)
const form = ref({
  title: '',
  subtitle: '',
  logoUrl: '',
  faviconUrl: '',
  icpNo: '',
  navHomeText: '',
  navBlogText: '',
  navInviteText: '',
  navPublishText: '',
  footerText: '',
  footerExtra: ''
})
const carousels = ref([])

const uploadAction = `${import.meta.env.VITE_API_BASE || ''}/api/file/upload-editor-image`
const uploadHeaders = {
  Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
}

const beforeImageUpload = (file) => {
  const isImage = file.type && file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('仅支持上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const handleConfigUploadSuccess = (field, res) => {
  if (res && res.code === 200 && res.data && res.data.url) {
    form.value[field] = res.data.url
    ElMessage.success('上传成功，已自动回填 URL')
    return
  }
  ElMessage.error((res && res.msg) || '上传失败')
}

const handleCarouselUploadSuccess = (index, res) => {
  if (res && res.code === 200 && res.data && res.data.url) {
    if (carousels.value[index]) {
      carousels.value[index].imageUrl = res.data.url
      ElMessage.success('上传成功，已自动回填 URL')
    }
    return
  }
  ElMessage.error((res && res.msg) || '上传失败')
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请稍后重试')
}

const loadData = async () => {
  try {
    const res = await siteStore.loadAdminSiteData()
    if (res.data && res.data.code === 200) {
      form.value = { ...siteStore.config }
      carousels.value = [...siteStore.carousels]
    } else {
      ElMessage.error(res.data.msg || '加载失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  }
}

const saveConfig = async () => {
  savingConfig.value = true
  try {
    const res = await siteStore.updateSiteConfig(form.value)
    if (res.data && res.data.code === 200) {
      ElMessage.success('基础信息保存成功')
      await loadData()
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    savingConfig.value = false
  }
}

const saveCarousels = async () => {
  savingCarousels.value = true
  try {
    const list = carousels.value.map((it, idx) => ({
      title: it.title || '',
      imageUrl: it.imageUrl || '',
      linkUrl: it.linkUrl || '',
      sort: Number(it.sort == null ? idx + 1 : it.sort),
      status: Number(it.status == null ? 1 : it.status)
    }))
    const res = await siteStore.replaceCarousels(list)
    if (res.data && res.data.code === 200) {
      ElMessage.success('轮播图保存成功')
      await loadData()
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络错误')
  } finally {
    savingCarousels.value = false
  }
}

const addCarousel = () => {
  carousels.value.push({
    title: '',
    imageUrl: '',
    linkUrl: '',
    sort: carousels.value.length + 1,
    status: 1
  })
}

const removeCarousel = (index) => {
  carousels.value.splice(index, 1)
}

onMounted(loadData)
</script>

<style scoped>
.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}
.block {
  margin-bottom: 14px;
}
.card-title {
  font-weight: 600;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
.carousel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.image-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-thumb {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}
</style>

