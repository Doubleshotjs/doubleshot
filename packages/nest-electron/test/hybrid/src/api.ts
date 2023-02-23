import axios from 'axios'

export async function testHttp() {
  axios.defaults.baseURL = 'http://localhost:3000'

  const printLog = (log: string) => axios.get(`/print-log/${log}`)

  const { data: res1 } = await axios.post('/data', { data: 'send http data to backend' })
  await printLog(res1)

  await axios.get('/exit')
}
