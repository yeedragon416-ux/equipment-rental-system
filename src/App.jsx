import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Search, Camera, Tablet, Mic, Calendar, User, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import './App.css'

// 模擬器材資料
const mockEquipment = [
  {
    id: 'EQ001',
    name: '單眼相機 Canon EOS 80D',
    category: '相機',
    image: '/src/assets/camera-equipment.jpeg',
    description: '高性能單眼相機，適合攝影課程使用，配備24.2MP APS-C CMOS感光元件。',
    totalQuantity: 5,
    availableQuantity: 3,
    status: '可借閱'
  },
  {
    id: 'EQ002',
    name: '繪圖板 Wacom Intuos Pro',
    category: '電繪板',
    image: '/src/assets/wacom-tablet.jpg',
    description: '專業級繪圖板，支援多點觸控，8192級壓感，適合數位繪畫課程。',
    totalQuantity: 10,
    availableQuantity: 8,
    status: '可借閱'
  },
  {
    id: 'EQ003',
    name: '繪圖板 Wacom Cintiq',
    category: '電繪板',
    image: '/src/assets/drawing-tablet.jpg',
    description: '專業繪圖顯示器，直接在螢幕上繪畫，提供最自然的創作體驗。',
    totalQuantity: 3,
    availableQuantity: 1,
    status: '可借閱'
  },
  {
    id: 'EQ004',
    name: '錄音設備套組',
    category: '錄音器材',
    image: '/src/assets/microphone-kit.jpg',
    description: '專業錄音麥克風套組，包含防震架、防噴罩等配件，適合音訊製作課程。',
    totalQuantity: 6,
    availableQuantity: 0,
    status: '已借完'
  },
  {
    id: 'EQ005',
    name: 'iPad Pro 12.9吋',
    category: '平板',
    image: '/src/assets/camera-equipment.jpeg',
    description: 'Apple iPad Pro，配備Apple Pencil，適合數位創作和設計課程。',
    totalQuantity: 8,
    availableQuantity: 5,
    status: '可借閱'
  }
]

// 模擬借閱記錄
const mockBorrowHistory = [
  {
    studentId: '411596453',
    studentName: '白佳蓉',
    equipmentName: '單眼相機 Canon EOS 80D',
    borrowDate: '2024-11-18 10:04',
    returnDate: '2024-11-18 12:00',
    status: '已歸還'
  },
  {
    studentId: '984106503',
    studentName: '吳豐清',
    equipmentName: '繪圖板 Wacom Intuos Pro',
    borrowDate: '2024-11-20 14:03',
    returnDate: '2024-11-20 16:10',
    status: '已歸還'
  }
]

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [filteredEquipment, setFilteredEquipment] = useState(mockEquipment)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [borrowForm, setBorrowForm] = useState({
    studentId: '',
    studentName: '',
    borrowDate: '',
    returnDate: '',
    purpose: ''
  })
  const [returnForm, setReturnForm] = useState({
    studentId: ''
  })
  const [studentBorrowHistory, setStudentBorrowHistory] = useState([])
  const [showBorrowDialog, setShowBorrowDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)

  const categories = ['全部', '相機', '電繪板', '錄音器材', '平板']

  // 篩選器材
  useEffect(() => {
    let filtered = mockEquipment

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== '全部') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    setFilteredEquipment(filtered)
  }, [searchTerm, selectedCategory])

  // 處理借閱申請
  const handleBorrowSubmit = () => {
    if (!borrowForm.studentId || !borrowForm.studentName || !borrowForm.borrowDate || !borrowForm.returnDate) {
      alert('請填寫所有必填欄位')
      return
    }
    
    // 這裡會連接到後端 API
    alert(`借閱申請已提交！\n器材：${selectedEquipment.name}\n學號：${borrowForm.studentId}\n姓名：${borrowForm.studentName}`)
    setShowBorrowDialog(false)
    setBorrowForm({
      studentId: '',
      studentName: '',
      borrowDate: '',
      returnDate: '',
      purpose: ''
    })
  }

  // 查詢學生借閱記錄
  const handleSearchHistory = () => {
    if (!returnForm.studentId) {
      alert('請輸入學號')
      return
    }
    
    // 模擬查詢結果
    const history = mockBorrowHistory.filter(record => 
      record.studentId === returnForm.studentId
    )
    setStudentBorrowHistory(history)
    setShowHistoryDialog(true)
  }

  // 獲取狀態顏色
  const getStatusColor = (status) => {
    switch (status) {
      case '可借閱':
        return 'bg-green-100 text-green-800'
      case '已借完':
        return 'bg-red-100 text-red-800'
      case '維修中':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 獲取類別圖示
  const getCategoryIcon = (category) => {
    switch (category) {
      case '相機':
        return <Camera className="w-4 h-4" />
      case '電繪板':
        return <Tablet className="w-4 h-4" />
      case '錄音器材':
        return <Mic className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁首 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">多媒體動畫科器材借閱系統</h1>
            </div>
            <div className="flex space-x-4">
              <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    歸還器材
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>歸還器材</DialogTitle>
                    <DialogDescription>
                      請輸入學號查詢您的借閱記錄
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="return-student-id" className="text-right">
                        學號
                      </Label>
                      <Input
                        id="return-student-id"
                        value={returnForm.studentId}
                        onChange={(e) => setReturnForm({...returnForm, studentId: e.target.value})}
                        className="col-span-3"
                        placeholder="請輸入學號"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSearchHistory}>查詢借閱記錄</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜尋和篩選 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="搜尋器材名稱或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="選擇類別" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 器材列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((equipment) => (
            <Card key={equipment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={equipment.image}
                  alt={equipment.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(equipment.category)}
                    <Badge variant="secondary">{equipment.category}</Badge>
                  </div>
                  <Badge className={getStatusColor(equipment.status)}>
                    {equipment.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{equipment.name}</CardTitle>
                <CardDescription className="text-sm">
                  {equipment.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>可借閱：{equipment.availableQuantity}/{equipment.totalQuantity}</span>
                  <div className="w-full bg-gray-200 rounded-full h-2 ml-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(equipment.availableQuantity / equipment.totalQuantity) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog open={showBorrowDialog && selectedEquipment?.id === equipment.id} onOpenChange={(open) => {
                  setShowBorrowDialog(open)
                  if (!open) setSelectedEquipment(null)
                }}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={equipment.availableQuantity === 0}
                      onClick={() => setSelectedEquipment(equipment)}
                    >
                      {equipment.availableQuantity === 0 ? '暫無庫存' : '借閱'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>借閱申請</DialogTitle>
                      <DialogDescription>
                        器材：{selectedEquipment?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="student-id" className="text-right">
                          學號 *
                        </Label>
                        <Input
                          id="student-id"
                          value={borrowForm.studentId}
                          onChange={(e) => setBorrowForm({...borrowForm, studentId: e.target.value})}
                          className="col-span-3"
                          placeholder="請輸入學號"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="student-name" className="text-right">
                          姓名 *
                        </Label>
                        <Input
                          id="student-name"
                          value={borrowForm.studentName}
                          onChange={(e) => setBorrowForm({...borrowForm, studentName: e.target.value})}
                          className="col-span-3"
                          placeholder="請輸入姓名"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="borrow-date" className="text-right">
                          借閱日期 *
                        </Label>
                        <Input
                          id="borrow-date"
                          type="datetime-local"
                          value={borrowForm.borrowDate}
                          onChange={(e) => setBorrowForm({...borrowForm, borrowDate: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="return-date" className="text-right">
                          預計歸還 *
                        </Label>
                        <Input
                          id="return-date"
                          type="datetime-local"
                          value={borrowForm.returnDate}
                          onChange={(e) => setBorrowForm({...borrowForm, returnDate: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="purpose" className="text-right">
                          借閱目的
                        </Label>
                        <Textarea
                          id="purpose"
                          value={borrowForm.purpose}
                          onChange={(e) => setBorrowForm({...borrowForm, purpose: e.target.value})}
                          className="col-span-3"
                          placeholder="請簡述借閱目的（選填）"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleBorrowSubmit}>提交借閱申請</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 借閱歷史對話框 */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>借閱記錄</DialogTitle>
              <DialogDescription>
                學號：{returnForm.studentId} 的借閱歷史
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {studentBorrowHistory.length > 0 ? (
                <div className="space-y-4">
                  {studentBorrowHistory.map((record, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{record.equipmentName}</h4>
                            <p className="text-sm text-gray-600">借閱時間：{record.borrowDate}</p>
                            <p className="text-sm text-gray-600">歸還時間：{record.returnDate}</p>
                          </div>
                          <Badge className={record.status === '已歸還' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {record.status}
                          </Badge>
                        </div>
                        {record.status === '借閱中' && (
                          <Button className="mt-4" size="sm">
                            歸還此器材
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">查無借閱記錄</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default App

