import mongoose from 'mongoose'
import { describe, expect, test, beforeEach } from '@jest/globals'

import {
  createPost,
  listAllPostsByTag,
  listAllPosts,
  listAllPostsByAuthor,
  getPostById,
  updatePost,
  deleteOne,
} from '../services/posts'
import { Post } from '../db/models/post'

describe('creating posts', () => {
  test('with all parameters should succeed', async () => {
    const post = {
      title: 'Hello Mongoose!',
      author: 'Daniel Bugl',
      contents: 'This post is stored in a MongoDB database using Mongoose.',
      tags: ['mongoose', 'mongodb'],
    }

    const createdPost = await createPost(post)
    console.log(`created Post id: ${createdPost._id}`)
    console.log('Created Post:', createdPost) // 确保文档被成功创建
    expect(createdPost._id).toBeInstanceOf(mongoose.Types.ObjectId)

    const foundPost = await Post.findById(createdPost._id)
    console.log('Found Post:', foundPost) // 确保文档被成功查询
    expect(foundPost).toEqual(expect.objectContaining(post))
    expect(foundPost.createdAt).toBeInstanceOf(Date)
    expect(foundPost.updatedAt).toBeInstanceOf(Date)
  }),
    test('without title should fail', async () => {
      const post = {
        author: 'Daniel Bugl',
        contents: 'This post is stored in a MongoDB database using Mongoose.',
        tags: ['mongoose', 'mongodb'],
      }

      try {
        await createPost(post)
      } catch (e) {
        expect(e).toBeInstanceOf(mongoose.Error.ValidationError)
        expect(e.message).toContain('`title` is required')
      }
    }),
    test('with minimal parameters should succeed', async () => {
      const post = {
        title: 'Only a title',
      }

      const createdPost = await createPost(post)
      console.log(`created Post id: ${createdPost._id}`)

      expect(createdPost._id).toBeInstanceOf(mongoose.Types.ObjectId)
    }),
    test('search Posts by a tag should succeed', async () => {
      const tag = 'mongoose'
      const posts = await listAllPostsByTag(tag, {
        sortBy: 'updatedAt',
        sortOrder: 'descending',
      })
      console.log('listALlPostsByTag:')
      console.log(posts)
    })
})

describe('listing posts', () => {
  test('should return all posts', async () => {
    const posts = await listAllPosts()
    expect(posts.length).toEqual(createdSamplePosts.length)
  }),
    test('should return posts sorted by creation date descending by default', async () => {
      const posts = await listAllPosts()
      const sortedSamplePosts = createdSamplePosts.sort(
        (a, b) => b.createdAt - a.createdAt,
      )
      expect(posts.map((post) => post.createdAt)).toEqual(
        sortedSamplePosts.map((post) => post.createdAt),
      )
    }),
    test('should take into account provided sorting options', async () => {
      const posts = await listAllPosts({
        sortBy: 'updatedAt',
        sortOrder: 'ascending',
      })

      const sortedSamplePosts = createdSamplePosts.sort(
        (a, b) => a.updatedAt - b.updatedAt,
      )

      expect(posts.map((post) => post.updatedAt)).toEqual(
        sortedSamplePosts.map((post) => post.updatedAt),
      )
    }),
    test('should be able to filter posts by author', async () => {
      const posts = await listAllPostsByAuthor('Daniel Bugl')
      expect(posts.length).toBe(3)
    }),
    test('should be able to filter posts by tag', async () => {
      const posts = await listAllPostsByTag('react')
      expect(posts.length).toBe(2)
    })
})

describe('getting a post', () => {
  test('should return the full post', async () => {
    const post = await getPostById(createdSamplePosts[0]._id)
    // expect(post._id).toEqual(createdSamplePosts[0]._id)
    expect(post.toObject()).toEqual(createdSamplePosts[0].toObject())
  }),
    test('should fail if id does not exist', async () => {
      const post = await getPostById('000000000000000000000000')
      expect(post).toEqual(null)
    })
})

describe('updating posts', () => {
  test('should update the specified property', async () => {
    await updatePost(createdSamplePosts[0]._id, { author: 'test author' })
    const updatedPost = await getPostById(createdSamplePosts[0]._id)
    expect(updatedPost.author).toEqual('test author')
  }),
    test('should not update other properties', async () => {
      await updatePost(createdSamplePosts[0]._id, {
        author: 'test author',
      })

      const post = await getPostById(createdSamplePosts[0]._id)
      expect(post.title).toEqual('Learning Redux')
    }),
    test('should update the updatedAt property', async () => {
      await updatePost(createdSamplePosts[0]._id, {
        author: 'test author',
      })

      const updatedPost = await getPostById(createdSamplePosts[0]._id)
      expect(updatedPost.updatedAt.getTime()).toBeGreaterThan(
        createdSamplePosts[0].updatedAt.getTime(),
      )
    }),
    test('should fail if the id dose not exist', async () => {
      const post = await updatePost('000000000000000000000000', {
        author: 'test author',
      })
      expect(post).toEqual(null)
    })
})

describe('deleting posts', () => {
  test('should remove the post from the database', async () => {
    const result = await deleteOne(createdSamplePosts[0]._id)
    expect(result.deletedCount).toBe(1)

    const deletedPost = await getPostById(createdSamplePosts[0]._id)
    expect(deletedPost).toEqual(null)
  }),
    test('should fail if id does not exist', async () => {
      const result = await deleteOne('000000000000000000000000')
      expect(result.deletedCount).toBe(0)
    })
})

const samplePosts = [
  { title: 'Learning Redux', author: 'Daniel Bugl', tags: ['redux'] },
  { title: 'Learn React Hooks', author: 'Daniel Bugl', tags: ['react'] },
  {
    title: 'Full-Stack React Projects',
    author: 'Daniel Bugl',
    tags: ['react', 'nodejs'],
  },
  { title: 'Guide to TypeScript' },
]

let createdSamplePosts = []

beforeEach(async () => {
  await Post.deleteMany({})
  createdSamplePosts = []
  for (const post of samplePosts) {
    const createdPost = new Post(post)
    createdSamplePosts.push(await createdPost.save())
  }
})