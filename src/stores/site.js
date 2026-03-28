import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

export const useSiteStore = defineStore('site', () => {
  const config = ref({
    title: 'Iungo',
    subtitle: '邀请制深度创作社区',
    logoUrl: '',
    faviconUrl: '',
    icpNo: '',
    navHomeText: '首页',
    navBlogText: '圈层博客',
    navInviteText: '我的邀请',
    navPublishText: '发布博客',
    footerText: 'Iungo © 2026 邀请制深度创作社区',
    footerExtra: ''
  })
  const carousels = ref([])

  const mapConfig = (raw) => {
    if (!raw) return
    config.value = {
      title: raw.title || 'Iungo',
      subtitle: raw.subtitle || '',
      logoUrl: raw.logoUrl || raw.logo_url || '',
      faviconUrl: raw.faviconUrl || raw.favicon_url || '',
      icpNo: raw.icpNo || raw.icp_no || '',
      navHomeText: raw.navHomeText || raw.nav_home_text || '首页',
      navBlogText: raw.navBlogText || raw.nav_blog_text || '圈层博客',
      navInviteText: raw.navInviteText || raw.nav_invite_text || '我的邀请',
      navPublishText: raw.navPublishText || raw.nav_publish_text || '发布博客',
      footerText: raw.footerText || raw.footer_text || '',
      footerExtra: raw.footerExtra || raw.footer_extra || ''
    }
  }

  const mapCarousels = (list) => {
    carousels.value = (list || []).map((it) => ({
      id: it.id || null,
      title: it.title || '',
      imageUrl: it.imageUrl || it.image_url || '',
      linkUrl: it.linkUrl || it.link_url || '',
      sort: Number(it.sort || 0),
      status: Number(it.status == null ? 1 : it.status)
    }))
  }

  const loadPublicSiteData = async () => {
    const [cfgRes, carouselRes] = await Promise.all([
      request.get('/api/site/config'),
      request.get('/api/site/carousels')
    ])
    if (cfgRes.data && cfgRes.data.code === 200) {
      mapConfig(cfgRes.data.data)
    }
    if (carouselRes.data && carouselRes.data.code === 200) {
      mapCarousels(carouselRes.data.data)
    }
  }

  const loadAdminSiteData = async () => {
    const res = await request.get('/api/admin/site/detail')
    if (res.data && res.data.code === 200 && res.data.data) {
      mapConfig(res.data.data.config)
      mapCarousels(res.data.data.carousels)
    }
    return res
  }

  const updateSiteConfig = async (payload) => {
    const res = await request.post('/api/admin/site/config/update', payload)
    return res
  }

  const replaceCarousels = async (list) => {
    const res = await request.post('/api/admin/site/carousels/replace', { list })
    return res
  }

  return {
    config,
    carousels,
    loadPublicSiteData,
    loadAdminSiteData,
    updateSiteConfig,
    replaceCarousels
  }
})

