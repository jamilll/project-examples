package main

import (
	"encoding/binary"
	"io/fs"
	"io/ioutil"
	"log"
	"os"
)

func main() {

	f, err := os.Open("./full_numpy_bitmap_cloud.npy")

	if err != nil {
		panic(err.Error())
	}

	// Always close every file that gets opened
	defer f.Close()

	// Get the size of the file
	stat, _ := f.Stat()
	size := stat.Size()

	// Create the buffer that will hold the data
	buf := make([]byte, size)
	err = binary.Read(f, binary.LittleEndian, &buf)
	if err != nil {
		log.Fatal(err.Error())
	}

	index := 80
	log.Println("size: ", size)
	log.Println("size without header: ", size-int64(index))
	var pics float32 = float32(size-81) / float32(784)
	log.Println("number of pics: ", pics)

	// width := 280
	// upLeft := image.Point{0, 0}
	// lowRight := image.Point{width, width}
	// img := image.NewRGBA(image.Rectangle{upLeft, lowRight})
	// const ln = 784
	// px := 0
	// py := 0
	// for i := 0; i < 100; i++ {
	// 	ss := i*ln + index
	// 	mibbuff := buf[ss : ss+ln+1]
	// 	for j, val := range mibbuff {
	// 		black := color.RGBA{val, val, val, 0xff}

	// 		img.SetRGBA((28*px + j%28), (28*py + j/28), black)
	// 	}
	// 	px++
	// 	if px == 10 {
	// 		px = 0
	// 		py++
	// 	}
	// }

	// f, _ = os.Create("image.png")
	// e := png.Encode(f, img)
	// if e != nil {
	// 	panic(e)
	// }
	// 80 + 78400
	err = ioutil.WriteFile("cloud.bin", buf[80:784080], fs.ModeAppend)
	if err != nil {
		panic("couldnt create bin file")
	}

}
