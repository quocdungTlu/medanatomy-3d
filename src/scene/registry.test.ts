import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { PropertyBinding } from 'three'
import { sourceNameOf } from './registry'
import { content } from '../content'

describe('sourceNameOf', () => {
  it('ưu tiên userData.za_name khi GLTFLoader đã làm sạch tên', () => {
    const o = new THREE.Object3D()
    o.name = PropertyBinding.sanitizeNodeName('Inferior vena cava (thoracic part)')
    o.userData.za_name = 'Inferior vena cava (thoracic part)'
    expect(o.name).not.toBe('Inferior vena cava (thoracic part)')
    expect(sourceNameOf(o)).toBe('Inferior vena cava (thoracic part)')
  })
  it('rơi về name khi không có za_name', () => {
    const o = new THREE.Object3D()
    o.name = 'Left ventricle'
    expect(sourceNameOf(o)).toBe('Left ventricle')
  })
  it('mọi meshNames trong nội dung đều bị sanitize khác đi hoặc giữ nguyên, không bao giờ trùng nhau sau sanitize', () => {
    const all = content.structures.flatMap((s) => s.meshNames)
    const sanitized = all.map((n) => PropertyBinding.sanitizeNodeName(n))
    expect(new Set(sanitized).size).toBe(all.length)
  })
})
