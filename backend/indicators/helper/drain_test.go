// Copyright (c) 2021-2026 Onur Cinar.
// The source code is provided under GNU AGPLv3 License.
// https://indicator

package helper_test

import (
	"testing"

	"indicator/v2/helper"
)

func TestDrain(_ *testing.T) {
	input := helper.SliceToChan([]int{2, 4, 6, 8})
	helper.Drain(input)
}
